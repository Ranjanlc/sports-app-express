module.exports = `type Team {
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
  type Player{
    id: ID!
    name:String!
  }
  type Wicket{
    inning1:Int
    inning2:Int
  }
  type CricketScore{
    inning1Score:Int
    inning2Score:Int
    overs:Float
    wickets:Wicket
  }
  type Bowler{
     player : Player!
     over:Float!
     maiden:Int!
     run:Int!
     wicket:Int!
     economy:Float!
  }
  type WicketContainer {
    type: String
    catcher:String
    bowler :String
  }
  type Batsman{
    player: Player!
    score:Int!
    balls:Int!
    fours:Int!
    sixes:Int!
    wicket: WicketContainer!
  }
  type BasketballScore{
    period1:Int
    period2:Int
    period3:Int
    period4:Int
  }
  type BasketballStatsStr{
    stat:String!
    home:String!
    away:String!
  }
  type PlayerStats{
    stat:String!
    points:Int!
  }
  type BasketballLineupPlayer{
    player:Player!
    shirt:Int!
    position:String!
    isSub:Boolean!
    points:Int!
    assists:Int!
    rebounds:Int!
    played:Int!
  }
  type MatchContainer {
    matches: [MatchList!]
    featuredMatch: FeaturedMatch
  }
  type FootballDetail {
    matches: FootballMatches
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
    venue: String
    spectators: Int
    refName: String
    refCountry: String
    startDate: String!
  }
  type Stats {
    stat: String!,
    home: Int!,
    away: Int!,
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
    firstHalfIncidents: [Incident!]
    secondHalfIncidents: [Incident!]
    extraTimeIncidents: [Incident]
    penaltyShootout: [Incident]
  }
  type CricketInfo {
    venue:String
    homeScore:CricketScore
    awayScore:CricketScore
    startDate:String!
    toss:String
    umpires:String
  }
  type CricketInnings {
    extras:String
    battingTeam:String!
    bowlingTeam:String!
    currentBatsmanId:String
    currentBowlerId:String
    bowlers:[Bowler!]!
    batsmen:[Batsman!]!
    fallOfWickets :[String]
  }
  type BasketballInfo{
    venue:String
    startDate:String!
    homeScore:BasketballScore
    awayScore:BasketballScore
  }
  type BasketballStats{
   otherStats:[Stats!]!,
   scoringStats:[BasketballStatsStr!]!,
   leadStats:[BasketballStatsStr!]!,
  }
  
  type BasketballLineups{
    home:[BasketballLineupPlayer!]!,
    away:[BasketballLineupPlayer!]!
  }

  type RootMutation {
    addFavourites(date: String): MatchList!
  }

  type Query {
    getMatchesList(date: String!,timeZoneDiff: String, sportName: String!,isLive: Boolean!,isCricket: Boolean!): MatchContainer

    getFootballDetails(compId: Int!): FootballDetail!
    getCompetitionDetails(compId: ID,uniqueId: ID!,dateState: String!,isCricket: Boolean!): CompetitionDetail!
    getCompMatches(uniqueId: ID!,appSeasonId: ID!,dateState: String!,page: Int,isCricket: Boolean!): CompetitionMatches!

    getFootballMatchLineup(matchId: ID!): FootballLineup!
    getFootballMatchInfo(matchId: ID!): FootballInfo!
    getFootballMatchStats(matchId: ID!): [Stats!]!
    getFootballMatchSummary(matchId: ID!): FootballSummary!
    getFootballMatchTable(compId: ID!): [FootballStanding!]!

    getCricketMatchInfo(matchId: ID!):CricketInfo!
    getCricketMatchInnings(matchId: ID!):[CricketInnings]!
    getCricketMatchTable(compId:ID!,uniqueId:ID!):[CompetitionStandingSet]

    getBasketballMatchInfo(matchId: ID!):BasketballInfo!
    getBasketballMatchStats(matchId: ID!):BasketballStats!
    getBasketballMatchLineups(matchId:ID!):BasketballLineups
    getBasketballMatchTable(uniqueId:ID!):[CompetitionStandingSet]
  }`;
