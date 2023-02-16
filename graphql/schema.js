const { buildSchema } = require('graphql');

module.exports = buildSchema(`
type Team {
    name:String!
    imageUrl:String!
}
type Event {
   matchId:ID!
   homeTeam:Team!
   awayTeam:Team!
   startTime:String!
   matchStatus:String!
   homeScore:Int
   awayScore:Int
   winnerTeam:Int
}
type MatchList {
    competitionName:String!
    competitionId:ID!
    competitionImage:String!
    venue:String!
    events:[Event!]!
}

type RootMutation{
    addFavourites(date:String):MatchList!
}

type RootQuery {
    getFootballMatches(date:String!):[MatchList!]
    getCricketMatches(date:String!):[MatchList!]
    getBasketballMatches(date:String!):[MatchList!]
}
schema {
    query:RootQuery
    mutation:RootMutation
  }
`);
