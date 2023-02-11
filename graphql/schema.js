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
}
type MatchList {
    competitionName:String!
    competitionId:ID!
    venue:String!
    events:[Event!]!
    competitionImage:String!
}
type RootMutation{
    createMatch(date:String):MatchList!
}

type RootQuery {
    getFootballMatches(date:String):[MatchList!]
    getCricketMatches(date:String):MatchList!
    getBasketballMatches(date:String):MatchList!
}
schema {
    query:RootQuery
    mutation:RootMutation
  }
`);
