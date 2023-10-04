import { YogaServerInstance } from 'graphql-yoga';
import waitOn from 'wait-on';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { stitchSchemas } from '@graphql-tools/stitch';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { GraphQLSchema } from 'graphql'
import { buildGraphQLWSExecutor } from '@graphql-tools/executor-graphql-ws'
import { FilterPrivateByDefault } from './privateByDefault';

type YogaFetch = YogaServerInstance<any, any>['fetch'];

const tranformer = new FilterPrivateByDefault();

type Service = {
  name: string,
  endpoint: string,
  subscriptionUrl: string,
  authorization?: string
}

// hard code services for now
const services: Service[] = [
//   {
//   name: 'posts',
//   endpoint: 'http://localhost:4001/graphql',
//   subscriptionUrl: 'ws://localhost:4001/graphql'
// },
{
  name: 'users',
  endpoint: 'http://localhost:4002/graphql',
  subscriptionUrl: 'http://localhost:4002/graphql',
},
 {
  name: 'isam',
  endpoint: 'http://localhost:4003/graphql',
  subscriptionUrl: 'ws://localhost:4003/graphql',
}]

export async function makeGatewaySchema({
  waitForPorts
}: {
  waitForPorts?: boolean;
} = {}) {
  if (waitForPorts) {
    await waitOn({ resources: ['tcp:4001', 'tcp:4002'] });
  }

  async function createSchemas(services: Service[]): Promise<Array<{ publicSchema, privateSchema, executor }>> {
    const subschemas = []
    for await (const service of services) {
      const { schema: privateSchema, executor } = await createPrivateSchema(service);
      const publicSchema = await createPublicSchema(privateSchema);
      subschemas.push({ privateSchema, publicSchema, executor })
    }
    return subschemas;
  }

  async function createPrivateSchema(service: Service) {
    const executor = buildExecutor(service)
    return { schema: await schemaFromExecutor(executor), executor }
  }

  function createPublicSchema(privateSchema: GraphQLSchema) {
    const publicSchema = tranformer.transformSchema(privateSchema)
    return publicSchema;
  }

  function buildExecutor(servConfig: Service) {
    const httpExecutor = buildHTTPExecutor({
      endpoint: servConfig.endpoint,
      method: 'POST',
      timeout: 5000,
      credentials: 'same-origin',
      useGETForQueries: false,
      headers(executionRequest) {
        // get the authorization header that was passed into the gateway 
        // and provide it to the remote service
        const { context } = executionRequest;
        const authorization = context?.authorization;
        return { authorization }
      },
    });

    const wsExecutor = buildGraphQLWSExecutor({
      url: servConfig.subscriptionUrl,
      keepAlive: 5000,
      retryAttempts: 60,
    });

    return executionRequest => {
      if (executionRequest.operationType === 'subscription') {
        // extracts the extensions and connectionParams. Appends the connectionParam object to the extensions to be included in the payload
        const { extensions = {}, context: { connectionParams } } = executionRequest;
        executionRequest.extensions = {
          ...extensions, connectionParams
          // connectionParams: {
          //   authorization: "bearer <token>""
          // }
        }
        return wsExecutor(executionRequest)
      }
      return httpExecutor(executionRequest)
    }
  }

  const serviceSubschemas = await createSchemas(services);
  const subschemas = serviceSubschemas.map(subschema => ({ schema: subschema.privateSchema, executor: subschema.executor }))

  const privateStiched = stitchSchemas({
    subschemas
  });

  const publicSubschemas = serviceSubschemas.map(subschema => ({ schema: subschema.publicSchema, executor: subschema.executor }))
  const publicStiched = stitchSchemas({
    subschemas
  })

  return { privateSchema: privateStiched, publicSchema: publicStiched }
}
