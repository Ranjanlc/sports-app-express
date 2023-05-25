const { buildSchema } = require('graphql');
module.exports = buildSchema(`
type Team {
    name:String!
    id:ID!
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
    uniqueId:ID
    competitionImage:String!
    venue:String!
    events:[Event!]!
}
type MatchContainer{
    matches:[MatchList!]
    featuredMatch:Event
}
type FootballStanding {
    group:String
    teamId:ID!
    teamImageUrl:String!
    position:Int!
    name:String! 
    played:Int!
    wins:Int! 
    loses:Int!
    draws:Int!
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
    losses:Int! 
    played:Int! 
    percentage:Float!
    points:Int 
}
type CricketStanding{
    name:String! 
    teamId:ID! 
    teamImageUrl:String! 
    position:Int! 
    wins:Int! 
    losses:Int 
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
    seasonId:ID! 
    standingSet:[BasketballStandingSet]
}
type CricketDetail{
    matchSet:CompetitionMatches
    seasonId:ID!
    standingSet:[CricketStandingSet]
}
type LineupPlayer{
    playerId:ID!,
    playerName:String!,
    playerNumber:Int!,
    formatPosition:String!,
}
type Lineup{
    team:Int!,
    players:[LineupPlayer],
    formation:[Int!]!,
    coach:String!,
}
type Sub{
    minute:Int!,
    minuteExtended:Int,
    team:Int!,
    subOutPlayerId:ID!,
    subInPlayerId:ID!,
    subOutPlayerName:String!,
    subInPlayerName:String!,
}
type Incident {
    minute:Int,
    team:Int!,
    playerName:String,
    incident:String!,
    minuteExtended:Int,
    score:[Int],
    hasAssisted:Boolean
    scorer:String,
    assister:String
}
type FootballLineup{
    lineups:[Lineup],
    subs:[Sub],
}
type FootballInfo{
    venue:String!,
    spectators:Int,
    refName:String!,
    refCountry:String!,
    startDate:String!
}
type FootballStats{
    stat:String!,
    home:Int!,
    away:Int!,
}
type FootballSummary{
    homeHTScore:Int!,
    awayHTScore:Int!,
    homeFTScore:Int!,
    awayFTScore:Int!,
    homeScore:Int,
    awayScore:Int,
    homeShootoutScore:Int,
    awayShootoutScore:Int,
    firstHalfIncidents:[Incident!]!,
    secondHalfIncidents:[Incident!]!,
    extraTimeIncidents:[Incident],
    penaltyShootout:[Incident],
}

type RootMutation{
    addFavourites(date:String):MatchList!
}

type RootQuery {
    getFootballMatches(date:String!,timeZoneDiff:String!):MatchContainer!
    getBasketballMatches(date:String!):MatchContainer!
    getCricketMatches(date:String!):MatchContainer!
    getLiveFootballMatches:MatchContainer!
    getLiveBasketballMatches:MatchContainer
    getLiveCricketMatches:MatchContainer
    getFootballDetails(compId:Int!):FootballDetail!
    getBasketballDetails(uniqueId:Int!,dateState:String!):BasketballDetail!
    getCricketDetails(compId:Int!,dateState:String!,uniqueId:Int!):CricketDetail!
    getBasketballCompMatches(uniqueId:Int!,appSeasonId:ID!,dateState:String!,page:Int):CompetitionMatches!
    getCricketCompMatches(compId:Int!,uniqueId:Int!,appSeasonId:ID!,dateState:String!,page:Int):CompetitionMatches!
    getFootballMatchLineup(matchId:Int!):FootballLineup!
    getFootballMatchInfo(matchId:Int!):FootballInfo!
    getFootballMatchStats(matchId:Int!):[FootballStats!]!
    getFootballMatchSummary(matchId:Int!):FootballSummary!
    getFootballMatchTable(compId:Int!):[FootballStanding!]!
}
schema {
    query:RootQuery
    mutation:RootMutation
  }
`);
