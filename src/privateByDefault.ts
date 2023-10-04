import { filterSchema, pruneSchema } from '@graphql-tools/utils';
import { wrapSchema, TransformEnumValues } from '@graphql-tools/wrap';
import {
  GraphQLSchema,
  GraphQLType,
  GraphQLFieldConfig,
  GraphQLArgumentConfig,
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLNonNull,
} from 'graphql';

const PUBLIC_PREFIX = 'public:';
const PREFIX_INDEX = PUBLIC_PREFIX.length;

export class FilterPrivateByDefault {
  transformSchema(originalSchema: GraphQLSchema): GraphQLSchema {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isPublicAccessAllowed = (config?: GraphQLFieldConfig<any, any> | GraphQLArgumentConfig) => {
      if (!config) return true;
      if (config.description?.startsWith(PUBLIC_PREFIX)) {
        config.description = config.description.substring(PREFIX_INDEX);
        return true;
      }
      return false;
    };

    const isTypePublic = (fieldType?: GraphQLType) => {
      if (!fieldType) {
        return false;
      }
      if (fieldType instanceof GraphQLList || fieldType instanceof GraphQLNonNull) {
        return true;
      }
      if (fieldType instanceof GraphQLScalarType) {
        if (fieldType.description?.startsWith(PUBLIC_PREFIX)) {
          fieldType.description = fieldType.description.substring(PREFIX_INDEX);
        }
        return true;
      }
      if (
        fieldType instanceof GraphQLScalarType ||
        fieldType instanceof GraphQLObjectType ||
        fieldType instanceof GraphQLInterfaceType ||
        fieldType instanceof GraphQLUnionType ||
        fieldType instanceof GraphQLEnumType ||
        fieldType instanceof GraphQLInputObjectType
      ) {
        if (fieldType.description?.startsWith(PUBLIC_PREFIX)) {
          fieldType.description = fieldType.description.substring(PREFIX_INDEX);
          return true;
        }
      }
      return false;
    };

    return pruneSchema(
      wrapSchema({
        schema: filterSchema({
          schema: originalSchema,
          typeFilter: (typeName, type) => isTypePublic(type),
          rootFieldFilter: (operationName, fieldName, fieldconfig) => isPublicAccessAllowed(fieldconfig),
          fieldFilter: (typeName, fieldName, fieldconfig) => isPublicAccessAllowed(fieldconfig),
          objectFieldFilter: (typeName, fieldName, fieldconfig) => isPublicAccessAllowed(fieldconfig),
          interfaceFieldFilter: (typeName, fieldName, fieldconfig) => isPublicAccessAllowed(fieldconfig),
          inputObjectFieldFilter: (typeName, fieldName, fieldconfig) => isPublicAccessAllowed(fieldconfig),
          argumentFilter: (typeName, fieldName, argName, argConfig) => isPublicAccessAllowed(argConfig),
        }),
        transforms: [
          new TransformEnumValues((typeName, enumValue, enumValueConfig) => {
            if (enumValueConfig.description?.startsWith(PUBLIC_PREFIX)) {
              enumValueConfig.description = enumValueConfig.description.substring(PREFIX_INDEX);
              return enumValueConfig;
            }
            return null;
          }),
        ],
      }),
    );
  }
}
