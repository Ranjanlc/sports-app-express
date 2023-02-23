const API_KEY = '8acd2e89a2mshe39f55bfd24361bp10e3fdjsnf764c88cfede';

const getMatchDate = (timeStamp) => {
  const dateObj = new Date(+timeStamp * 1000);
  const year = dateObj.getFullYear();
  const month = dateObj.getUTCMonth() + 1; // add 1 since month is zero-based
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getUTCSeconds();
  // Format the date and time as a string
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedTime;
};
const checkWickets = (wickets) => {
  return `${wickets === 10 ? '' : `/${wickets}`}`;
};
const refineInnings = (homeScore, awayScore) => {
  const { display: homeDisplay, innings: homeInnings } = homeScore;
  const { display: awayDisplay, innings: awayInnings } = awayScore;
  let displayHomeScore, displayAwayScore;
  const homeInningsRefined = homeInnings
    ? homeInnings
    : {
        inning1: {
          score: 'Yet to bat',
          wickets: 0,
          overs: '-',
        },
      };
  const awayInningsRefined = awayInnings
    ? awayInnings
    : {
        inning1: {
          score: 'Yet to bat',
        },
      };
  const {
    inning1: {
      score: home1stScore,
      wickets: home1stWickets,
      overs: home1stOvers,
    },
    inning2: homeInning2,
  } = homeInningsRefined;
  const {
    inning1: {
      score: away1stScore,
      wickets: away1stWickets,
      overs: away1stOvers,
    },
    inning2: awayInning2,
  } = awayInningsRefined;
  if (homeInning2 || awayInning2) {
    const awayTotalScore = awayDisplay;
    const homeTotalScore = homeDisplay;
    let dirtyHomeScore;
    if (homeInning2) {
      dirtyHomeScore = `${homeInning2.score}${checkWickets(
        homeInning2.wickets
      )} (${homeInning2.overs})`;
    } else {
      dirtyHomeScore = `${home1stScore}${checkWickets(
        home1stWickets
      )} (${home1stOvers})`;
    }
    let dirtyAwayScore;
    if (awayInning2) {
      dirtyAwayScore = `${awayInning2.score}${checkWickets(
        awayInning2.wickets
      )} (${awayInning2.overs})`;
    } else {
      dirtyAwayScore = `${away1stScore}${checkWickets(
        away1stWickets
      )} (${away1stOvers})`;
    }
    displayHomeScore = `${dirtyHomeScore} ${homeTotalScore}`;
    displayAwayScore = `${dirtyAwayScore} ${awayTotalScore}`;
  } else {
    //To check if there is innings object in homeScore,where the match might be played and it's innings may not come;
    displayHomeScore = homeScore.innings
      ? `${home1stScore}${checkWickets(home1stWickets)} (${home1stOvers})`
      : 'Yet to bat';
    displayAwayScore = awayScore.innings
      ? `${away1stScore}${checkWickets(away1stWickets)} (${away1stOvers})`
      : 'Yet to bat';
  }
  return { displayHomeScore, displayAwayScore };
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
      teamId,
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
  // console.log(standings);
  return standings;
};
module.exports = {
  getMatchDate,
  checkWickets,
  refineInnings,
  API_KEY,
  getFootballStandings,
  refineStandings,
};
