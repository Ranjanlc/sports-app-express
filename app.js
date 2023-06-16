const express = require('express');
// const { graphqlHTTP } = require('express-graphql');
const { createYoga, createSchema } = require('graphql-yoga');
const { clearHandler } = require('graphql-http');
const graphqlSchema = require('./graphql/schema');
const {
  getFootballDetails,
  getCompetitionDetails,
  getMatchesList,
  getCompMatches,
  getFootballMatchInfo,
  getFootballMatchLineup,
  getFootballMatchStats,
  getFootballMatchSummary,
  getFootballMatchTable,
} = require('./graphql/resolvers');
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(
  '/graphql',
  createYoga({
    schema: createSchema({
      typeDefs: graphqlSchema,
      resolvers: {
        Query: {
          getFootballDetails,
          getCompMatches,
          getCompetitionDetails,
          getMatchesList,
          getFootballMatchInfo,
          getFootballMatchLineup,
          getFootballMatchStats,
          getFootballMatchSummary,
          getFootballMatchTable,
        },
      },
    }),
    context: (req) => {
      return {
        variables: req.req.body.variables || {},
      };
    },
    maskedErrors: true, //only for dev
    // Erorrs if thrown with GraphQL Error constructor, it would automatically detect it.
    logging: true,
  })
);
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

app.listen(8080);
