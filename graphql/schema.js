const { buildSchema } = require('graphql');

/* type Inning {
    score:Int!
    wickets:Int!
    overs:Float!
}
type Innings {
    inning1:Inning!
    inning2:Inning
}
*/
module.exports = buildSchema(`

type Team {
    name:String!
    imageUrl:String!
    isBatting:Boolean
}
type Event {
    matchId:ID!
    homeTeam:Team!
    awayTeam:Team!
    startTime:String!
    matchStatus:String!
    homeScore:String
    awayScore:String
    winnerTeam:Int
    note:String
}

type MatchList {
    competitionName:String!
    competitionId:ID
    competitionImage:String!
    venue:String!
    events:[Event!]!
}
type CompetitionStanding {
    group:String
    teamId:ID!
    position:Int
    name:String! 
    played:Int!
    wins:Int! 
    draws:Int! 
    loses:Int!
    GF:Int!
    GA:Int! 
    GD:Int! 
    points:Int! 
}
type CompetitionMatches{
    fixtures:[Event!]!
    results:[Event!]!
}
type CompetitionDetail {
    matches:CompetitionMatches!
    standings:[CompetitionStanding]
}

type RootMutation{
    addFavourites(date:String):MatchList!
}

type RootQuery {
    getFootballMatches(date:String!):[MatchList!]
    getBasketballMatches(date:String!):[MatchList!]
    getCricketMatches(date:String!):[MatchList!]
    getLiveFootballMatches:[MatchList]
    getLiveBasketballMatches:[MatchList]
    getLiveCricketMatches:[MatchList]
    getCompetitionDetails(compId:Int!):CompetitionDetail!
}
schema {
    query:RootQuery
    mutation:RootMutation
  }
`);
