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
      typeDefs: /* GraphQL */ `
        type Team {
          name: String!
          id: ID!
          imageUrl: String!
          isBatting: Boolean
        }
        type Event {
          matchId: ID!
          homeTeam: Team!
          awayTeam: Team!
          startTime: String!
          matchStatus: String!
          homeScore: String
          awayScore: String
          winnerTeam: Int
          note: String
        }
        type FeaturedMatch {
          event: Event!
          competitionName: String!
          competitionId: ID
        }
        type MatchList {
          competitionName: String!
          competitionId: ID
          uniqueId: ID
          competitionImage: String!
          venue: String!
          events: [Event!]!
        }

        type FootballStanding {
          group: String
          teamId: ID!
          teamImageUrl: String!
          position: Int!
          name: String!
          played: Int!
          wins: Int!
          loses: Int!
          draws: Int!
          GF: Int!
          GA: Int!
          GD: Int!
          points: Int!
        }
        type CompetitionStanding {
          name: String!
          teamId: ID!
          teamImageUrl: String!
          position: Int!
          wins: Int!
          losses: Int!
          played: Int!
          percentage: Float
          points: Int
          netRunRate: Float
        }
        type CompetitionStandingSet {
          standings: [CompetitionStanding]
          groupName: String
        }
        type FootballMatches {
          fixtures: [Event!]!
          results: [Event!]!
        }
        type LineupPlayer {
          playerId: ID
          playerName: String!
          playerNumber: Int!
          formatPosition: String!
        }
        type Lineup {
          team: Int!
          players: [LineupPlayer]
          formation: [Int!]!
          coach: String!
        }
        type Sub {
          minute: Int!
          minuteExtended: Int
          team: Int!
          subOutPlayerId: ID!
          subInPlayerId: ID!
          subOutPlayerName: String!
          subInPlayerName: String!
        }
        type Incident {
          minute: Int
          team: Int!
          playerName: String
          incident: String!
          minuteExtended: Int
          score: [Int]
          hasAssisted: Boolean
          scorer: String
          assister: String
        }
        type MatchContainer {
          matches: [MatchList!]
          featuredMatch: FeaturedMatch
        }
        type FootballDetail {
          matches: FootballMatches!
          standings: [FootballStanding]
        }
        type CompetitionMatches {
          matches: [Event!]!
          hasNextPage: Boolean!
        }
        type CompetitionDetail {
          matchSet: CompetitionMatches
          seasonId: ID!
          standingSet: [CompetitionStandingSet]
        }
        type FootballLineup {
          lineups: [Lineup!]!
          subs: [Sub]
        }
        type FootballInfo {
          venue: String!
          spectators: Int
          refName: String
          refCountry: String
          startDate: String!
        }
        type FootballStats {
          stat: String!
          home: Int!
          away: Int!
        }
        type FootballSummary {
          homeHTScore: Int!
          awayHTScore: Int!
          homeFTScore: Int!
          awayFTScore: Int!
          homeScore: Int
          awayScore: Int
          homeShootoutScore: Int
          awayShootoutScore: Int
          firstHalfIncidents: [Incident!]!
          secondHalfIncidents: [Incident!]
          extraTimeIncidents: [Incident]
          penaltyShootout: [Incident]
        }

        type RootMutation {
          addFavourites(date: String): MatchList!
        }

        type Query {
          getMatchesList(
            date: String!
            timeZoneDiff: String
            sportName: String!
            isLive: Boolean!
            isCricket: Boolean!
          ): MatchContainer
          getFootballDetails(compId: Int!): FootballDetail!
          getCompetitionDetails(
            compId: ID
            uniqueId: ID!
            dateState: String!
            isCricket: Boolean!
          ): CompetitionDetail!
          getCompMatches(
            uniqueId: ID!
            appSeasonId: ID!
            dateState: String!
            page: Int
            isCricket: Boolean!
          ): CompetitionMatches!
          getFootballMatchLineup(matchId: ID!): FootballLineup!
          getFootballMatchInfo(matchId: ID!): FootballInfo!
          getFootballMatchStats(matchId: ID!): [FootballStats!]!
          getFootballMatchSummary(matchId: ID!): FootballSummary!
          getFootballMatchTable(compId: ID!): [FootballStanding!]!
        }
      `,
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
      // console.log('Request body:', req.req.body); // Log the req.body to the console
      return {
        variables: req.req.body.variables || {},
      };
    },
    maskedErrors: true,
    logging: true,
  })
);
//   customFormatErrorFn: (err) => {
//     if (!err.originalError) {
//       return err;
//     }
//     const data = err.originalError.data;
//     const message = err.message || ' An Error occured';
//     const code = err.originalError.code || 500;
//     // WE can name these field in the way we want
//     return { message, status: code, data };
//   },
// })
// );
app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message, data });
});

app.listen(8080);
