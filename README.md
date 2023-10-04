# Public/Private schemas Mutations & Subscriptions (graphql-ws)

This sample reworks the [Mutation and Subscriptions](https://the-guild.dev/graphql/stitching/handbook/foundation/mutations-and-subscriptions) to use websockets and attempts dynamic schema


This sample uses a sample that it outside this git repo https://github.com/cramhead/nest-gql-pub-sub. The repo includes a GraphQL API that has queries, mutations and subscription where the subscriptions use websockets.

## Some Sample Queries for the Playground

```bash
curl 'http://localhost:4000/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'Origin: altair://-' --data-binary '{"query":"query Author {\n  author(id: 1){\n    firstName\n    lastName\n    id\n  }\n  \n}","variables":{}}' --compressed
```

```bash
curl 'http://localhost:4000/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'Origin: altair://-' --data-binary '{"query":"mutation AddPost { \n    addPost(authorId: 1, title: \"Some new post\"){\n      id\n      title\n      author{\n        id\n        firstName\n        lastName\n      }\n    }\n}","variables":{}}' --compressed
```

```bash
curl 'http://localhost:4000/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'Origin: altair://-' --data-binary '{"query":"subscription PostAdded{\n  postAdded{\n    id\n    title\n    author{\n      id\n      firstName\n      lastName\n    }\n  }\n}","variables":{}}' --compressed

```