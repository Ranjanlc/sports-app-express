const { getMatchDate, refineInnings } = require('./transform-data');

const refineEvents = (boilerData, sport, dateState) => {
  const {
    id: matchId,
    status: { description: matchStatus },
    homeTeam: { name: homeTeamName, id: homeTeamId },
    awayTeam: { name: awayTeamName, id: awayTeamId },
    homeScore, //complexity coz of API's name.
    awayScore,
    winnerCode: winnerTeam,
    startTimestamp,
    note,
  } = boilerData;
  const event = {
    matchId,
    matchStatus,
    homeTeam: {
      name: homeTeamName,
      imageUrl: `https://api.sofascore.app/api/v1/team/${homeTeamId}/image`,
      id: homeTeamId,
    },
    awayTeam: {
      name: awayTeamName,
      imageUrl: `https://api.sofascore.app/api/v1/team/${awayTeamId}/image`,
      id: awayTeamId,
    },
    startTime: getMatchDate(startTimestamp),
    // will note set if it is basketball
    [sport === 'cricket' && 'note']:
      matchStatus === 'Ended' ? note : matchStatus,
  };
  if (dateState === 'last') {
    event.winnerTeam = winnerTeam;
    if (sport === 'basketball') {
      event.homeScore = homeScore.display;
      event.awayScore = awayScore.display;
    }
    if (sport === 'cricket') {
      const { currentBattingTeamId: battingId } = boilerData;
      if (battingId === homeTeamId) {
        event.homeTeam.isBatting = true;
      }
      if (battingId === awayTeamId) {
        event.awayTeam.isBatting = true;
      }
      const { displayHomeScore, displayAwayScore } = refineInnings(
        homeScore,
        awayScore
      );
      event.homeScore = displayHomeScore;
      event.awayScore = displayAwayScore;
      //Overwriting default matchStatus notes with below.
      if (matchStatus === 'Not Started') {
        event.note = 'Not Started Yet';
      }
      if (matchStatus === 'Abandoned') {
        event.note = 'Match abandoned without a ball bowled';
      }
      if (matchStatus === 'Interrupted') {
        event.note = 'Match was interrupted.';
      }
    }
  }
  return event;
};
const refineStandings = (compData, sport) => {
  const { rows: standingSet } = compData;
  const standings = standingSet.map((teamData) => {
    const {
      team: { name, id: teamId },
      position,
      wins,
      losses,
      points,
      percentage,
      matches: played,
      netRunRate,
    } = teamData;
    if (sport === 'cricket') {
      return {
        name,
        teamId,
        teamImageUrl: `https://api.sofascore.app/api/v1/team/${teamId}/image`,
        position,
        points,
        played,
        wins,
        losses,
        netRunRate,
      };
    }
    if (sport === 'basketball') {
      return {
        name,
        teamId,
        teamImageUrl: `https://api.sofascore.app/api/v1/team/${teamId}/image`,
        position,
        [points && 'points']: points,
        played,
        wins,
        losses,
        percentage,
      };
    }
  });
  return standings;
};
const getFootballStandings = (data, setGroup = false) => {
  const {
    LEAGUE_TABLE: { L },
  } = data;
  const { TABLES: table } = L[0];
  const { TEAM: teams } = table[0];
  const standings = teams.map((team) => {
    const {
      TEAM_ID: teamId,
      BADGE_ID: badgeId,
      RANK: position,
      TEAM_NAME: name,
      TEAM_PLAYED: played,
      WINS_INT: wins,
      DRAWS_INT: draws,
      LOSES_INT: loses,
      GOAL_FOR: GF,
      GOAL_AGAINST: GA,
      GOAL_DIFFERENCE: GD,
      POINTS_INT: points,
    } = team;
    countryCode = setGroup && data.COUNTRY_CODE;
    return {
      [setGroup && 'group']: countryCode,
      teamId: +teamId,
      teamImageUrl: `https://lsm-static-prod.livescore.com/medium/enet/${badgeId}.png`,
      position,
      name,
      played,
      wins,
      draws,
      loses,
      GF,
      GA,
      GD,
      points,
    };
  });
  return standings;
};
module.exports = { refineEvents, refineStandings, getFootballStandings };
