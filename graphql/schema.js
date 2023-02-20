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
type FootballStanding {
    group:String
    teamId:ID!
    teamImageUrl:String!
    position:Int!
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
type BasketballStanding {
    name:String!
    teamId:ID!
    teamImageUrl:String! 
    position:Int! 
    wins:Int! 
    loses:Int! 
    played:Int! 
    percentage:Float!
    points:Int 
    gamesBehind:Float
}
type CricketStanding{
    name:String! 
    teamId:ID! 
    teamImageUrl:String! 
    position:Int! 
    wins:Int! 
    loses:Int! 
    played:Int! 
    points:Int! 
    netRunRate:Float! 
}
type CricketStandingSet{
    standings:[CricketStanding]
    groupName:String
}
type BasketballStandingSet {
    standings:[BasketballStanding]
    groupName:String
}
type FootballMatches{
    fixtures:[Event!]!
    results:[Event!]!
}
type CompetitionMatches{
    matches:[Event!]!
    hasNextPage:Boolean!
}
type FootballDetail {
    matches:FootballMatches!
    standings:[FootballStanding]
}
type BasketballDetail{
    matchSet:CompetitionMatches
    standingSet:[BasketballStandingSet]
}
type CricketDetail{
    matchSet:CompetitionMatches
    standingSet:[CricketStandingSet]
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
    getFootballDetails(compId:Int!):FootballDetail!
    getBasketballDetails(uniqueId:Int!,appSeasonId:Int,dateState:String,page:Int):BasketballDetail!
    getCricketDetails(uniqueId:Int!,appSeasonId:Int,dateState:String,page:Int):CricketDetail!
}
schema {
    query:RootQuery
    mutation:RootMutation
  }
`);
