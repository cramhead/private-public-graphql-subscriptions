# Public/Private schemas Mutations & Subscriptions (graphql-ws)

This sample reworks the [Mutation and Subscriptions](https://the-guild.dev/graphql/stitching/handbook/foundation/mutations-and-subscriptions) to use websockets and attempts dynamic schema


This sample uses a sample that it outside this git repo https://github.com/cramhead/nest-gql-pub-sub. The repo includes a GraphQL API that has queries, mutations and subscription where the subscriptions use websockets.

The https://github.com/cramhead/nest-gql-pub-sub is a repo that I already had running that use websocket-based subscriptions. It depends on Redis so I added a docker-compose.yml to help set this up. 
After cloning https://github.com/cramhead/nest-gql-pub-sub running `docker compose -up -d` should start Redis and the Nestjs based GraphQL project that uses Redis PubSub with graphql-ws WebSockets. 

After that `npm install` && `npm start` in this repo.
You should be able to make calls like those listed below and see that GraphQL subscriptions with graphql-ws work correctly. 
Once line 11 of the index.ts is commented out and line 12 is uncommented the subscriptions stop working. 

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