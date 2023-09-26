import { createYoga, YogaServerInstance } from 'graphql-yoga';
import waitOn from 'wait-on';
import { buildHTTPExecutor } from '@graphql-tools/executor-http';
import { stitchSchemas } from '@graphql-tools/stitch';
import { schemaFromExecutor } from '@graphql-tools/wrap';
import { getOperationAST } from 'graphql'
import { buildGraphQLWSExecutor } from '@graphql-tools/executor-graphql-ws'

type YogaFetch = YogaServerInstance<any, any>['fetch'];

export async function makeGatewaySchema({
  waitForPorts,
  postsFetch,
  usersFetch,
  personsFetch
}: {
  waitForPorts?: boolean;
  postsFetch?: YogaFetch;
  usersFetch?: YogaFetch;
  personsFetch?: YogaFetch;
} = {}) {
  if (waitForPorts) {
    await waitOn({ resources: ['tcp:4001', 'tcp:4002'] });
  }

  // build executor functions
  // for communicating with remote services
  const postsExec = buildHTTPExecutor({
    endpoint: 'http://localhost:4001/graphql',
    fetch: postsFetch,
  });
  const usersExec = buildHTTPExecutor({
    endpoint: 'http://localhost:4002/graphql',
    fetch: usersFetch,
  });

  function buildCombinedExecutor() {
    const httpExecutor = buildHTTPExecutor({
      endpoint: 'http://localhost:4003/graphql'
    })
    const wsExecutor = buildGraphQLWSExecutor({
      url: 'ws://localhost:4003/graphql'
    })
    return executorRequest => {
      if (executorRequest.operationType === 'subscription') {
        return wsExecutor(executorRequest)
      }
      return httpExecutor(executorRequest)
    }
  }

  function buildIsamExecutor() {
    const httpExecutor = buildHTTPExecutor({
      endpoint: 'https://isam.my.bluescape.io/graphql', 
      method: 'POST',
      headers(executorRequest) {
        console.log(`executorRequest`, executorRequest)
        return ({
          "authorization": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImswIn0.eyJleHAiOjE2OTYzNTczOTAsInNwaWQiOm51bGwsIm1mYSI6bnVsbCwibmJmIjoxNjk1MTQ3NzgwLCJpYXQiOjE2OTUxNDc3OTAsImp0aSI6IlhYVXRtcDlYNXpjSGdVYklMQi1Yam9BMGJ3RXU2Z3ZnMUVWakpBZlQyd2YxRkhXRSIsInN1YiI6InZqWk9obWdSajhjVGFnb3hvd2xiIiwidXNlclR5cGUiOiJyZWdpc3RlcmVkIiwiYXVkIjpbImlzYW1kbmpKc2tqR0c0RHplZDJadklkVFhTQThuRFU2NFBLc2EiLCIzNmY4Y2Y1MTc1ZTRmYWFhNGYwNjcxODQwNGI3ZGY5NGRkYzBkOGFlIiwiMDE1ZjQ4MWFjZmU0MDJjOWJhZTQzNTM4OWVmYmI2OTE0OTI5Y2U5ZCIsIjAxNWY0ODFhY2ZlNDAyYzliYWU0MzUzODllZmJiNjkxNDkyOWJmOGMiLCJWSkJ0aWFKZG5qSi1rakdHNER6ZWQyWnZJZFRYU0E4bkRVNjRQSzBjIiwid3NzaXplcmtuakpza2pHRzREemVkMlpTQThuRFU2NFBLZmkiXSwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS1hcGkubXkuYmx1ZXNjYXBlLmlvIn0.BDLeuiGQWvFyOJDfKjJgYFDyewcbZjfI7UrEhotTJ6o"
        });
      },
    })
    const wsExecutor = buildGraphQLWSExecutor({
      url: 'wss://isam.my.bluescape.io/graphql',
      connectionParams: {
        "authorization": "bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImswIn0.eyJleHAiOjE2OTYzNTczOTAsInNwaWQiOm51bGwsIm1mYSI6bnVsbCwibmJmIjoxNjk1MTQ3NzgwLCJpYXQiOjE2OTUxNDc3OTAsImp0aSI6IlhYVXRtcDlYNXpjSGdVYklMQi1Yam9BMGJ3RXU2Z3ZnMUVWakpBZlQyd2YxRkhXRSIsInN1YiI6InZqWk9obWdSajhjVGFnb3hvd2xiIiwidXNlclR5cGUiOiJyZWdpc3RlcmVkIiwiYXVkIjpbImlzYW1kbmpKc2tqR0c0RHplZDJadklkVFhTQThuRFU2NFBLc2EiLCIzNmY4Y2Y1MTc1ZTRmYWFhNGYwNjcxODQwNGI3ZGY5NGRkYzBkOGFlIiwiMDE1ZjQ4MWFjZmU0MDJjOWJhZTQzNTM4OWVmYmI2OTE0OTI5Y2U5ZCIsIjAxNWY0ODFhY2ZlNDAyYzliYWU0MzUzODllZmJiNjkxNDkyOWJmOGMiLCJWSkJ0aWFKZG5qSi1rakdHNER6ZWQyWnZJZFRYU0E4bkRVNjRQSzBjIiwid3NzaXplcmtuakpza2pHRzREemVkMlpTQThuRFU2NFBLZmkiXSwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS1hcGkubXkuYmx1ZXNjYXBlLmlvIn0.BDLeuiGQWvFyOJDfKjJgYFDyewcbZjfI7UrEhotTJ6o"
      }
    })
    return executorRequest => {
      if (executorRequest.operationType === 'subscription') {
        return wsExecutor(executorRequest)
      }
      return httpExecutor(executorRequest)
    }
  }

  const personsExec = buildCombinedExecutor()
  //  buildHTTPExecutor({
  //   endpoint: 'http://localhost:4003/graphql',
  //   fetch: personsFetch,
  //   method: 'GET',
  //   useGETForQueries: false,
  //   // headers: {"Content-Type": "application/json"}
  // });

  return stitchSchemas({
    subschemas: [
      // {
      //   schema: await schemaFromExecutor(postsExec),
      //   executor: postsExec,
      // },
      // {
      //   schema: await schemaFromExecutor(usersExec),
      //   executor: usersExec,
      //   merge: {
      //     // Combine the User type across services...
      //     // discussed in chapters three and four.
      //     User: {
      //       selectionSet: '{ id }',
      //       fieldName: 'user',
      //       args: ({ id }) => ({ id }),
      //     },
      //   },
      // },
      {
        schema: await schemaFromExecutor(personsExec),
        executor: personsExec,
      }, 
      {
        schema: await schemaFromExecutor(buildIsamExecutor()),
        executor: buildIsamExecutor()
      }
    ],
  });
}

export function makeGatewayApp({
  waitForPorts,
  postsFetch,
  usersFetch,
  personsFetch,
}: {
  waitForPorts?: boolean;
  postsFetch?: YogaFetch;
  usersFetch?: YogaFetch;
  personsFetch?: YogaFetch;
} = {}) {
  return createYoga({
    schema: makeGatewaySchema({
      waitForPorts,
      postsFetch,
      usersFetch,
      personsFetch,
    }),
    maskedErrors: false,
    graphiql: {
      title: 'Mutations & subscriptions',
      defaultQuery: /* GraphQL */ `
        query Posts {
          posts {
            id
            message
            user {
              username
              email
            }
          }
        }

        mutation CreatePost {
          createPost(message: "hello world") {
            id
            message
            user {
              username
              email
            }
          }
        }

        subscription OnNewPost {
          newPost {
            id
            message
            user {
              id
              username
              email
            }
          }
        }
      `,
    },
  });
}
