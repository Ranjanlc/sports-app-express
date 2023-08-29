// ADDITIONAL-TODO: Add a prediction counter and simulate it using database and based on matchId.

const express = require("express");
// const { graphqlHTTP } = require('express-graphql');
const { createYoga, createSchema } = require("graphql-yoga");
const { clearHandler } = require("graphql-http");
const graphqlSchema = require("./graphql/schema");
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
  getCricketMatchInfo,
  getCricketMatchInnings,
  getCricketMatchTable,
  getBasketballMatchInfo,
  getBasketballMatchStats,
  getBasketballMatchLineups,
  getBasketballMatchTable,
} = require("./graphql/resolvers");
const app = express();

app.use(express.json());
app.use((req, res, next) => {
  const allowedOrigin = "https://ballscore.vercel.app";
  const allowedOrigin2 = "https://deployment.d1qzxwzcfybbvy.amplifyapp.com";
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  // Check if the request origin matches the allowed origin
  if (req.headers.origin === allowedOrigin) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );

    next();
  } else if (req.headers.origin === allowedOrigin2) {
    res.setHeader("Access-Control-Allow-Origin", allowedOrigin2);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  } else {
    return res.status(403).send("FORBIDDEN REQUEST BRO");
  }
});

app.use(
  "/graphql",
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
          getCricketMatchInfo,
          getCricketMatchInnings,
          getCricketMatchTable,
          getBasketballMatchInfo,
          getBasketballMatchStats,
          getBasketballMatchLineups,
          getBasketballMatchTable,
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
