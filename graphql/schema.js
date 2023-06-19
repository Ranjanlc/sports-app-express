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
    venue: String
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
    firstHalfIncidents: [Incident!]
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
  }`;
