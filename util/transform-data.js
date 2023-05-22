const API_KEY = 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926';
const footballApiOptions = {
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
  },
};
const sportApiOptions = {
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
  },
};
const topClubs = {
  football: {
    pl: [
      'Liverpool',
      'Manchester City',
      'Arsenal',
      'Manchester United',
      'Chelsea',
      'Tottenham Hotspur',
    ],
    laLiga: ['Barcelona', 'Real Madrid', 'Atletico Madrid', 'Real Sociedad'],
    serieA: ['Juventus', 'Napoli', 'Inter', 'AC Milan', 'Roma'],
    ligue1: ['Paris Saint-Germain', 'Marseille', 'Monaco', 'Lens'],
    bundesliga: ['Bayern Munich', 'Dortmund', 'Union Berlin', 'RB Leipzig'],
  },
  basketball: {
    nba: [
      'Boston Celtics',
      'Milwaukee Bucks',
      'Denver Nuggets',
      'Philadelphia 76ers',
      'Memphis Grizzlies',
    ],
    ligaACB: ['Real Madrid', 'Baskonia', 'Lenovo Tenerife', 'Unicaja'],
    a1: ['Olympiacos', 'Panathinaikos', 'Peristeri', 'PAOK'],
    lnb: ['Instituto', 'Obras', 'Quimsa', 'Gimnasia CR', 'Boca Jrs'],
    serieA: ['Olimpia Milano', 'Virtus', 'Derthona', 'Pesaro'],
  },
  cricket: {
    ipl: [
      'Chennai Super Kings',
      'Gujarat Titans',
      'Mumbai Indians',
      'Royal Challengers Bangalore',
      'Sunrisers Hyderabad',
    ],
    bbl: [
      'Perth Scorchers',
      'Sydney Thunder',
      'Sydney Sixers',
      ' Melbourne Renegades',
    ],
    psl: ['Multan Sultans', 'Islamabad United', 'Lahore Qalandars'],
  },
};

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
const refineFootballDate = (dirtyStartTime, timeZoneDiff) => {
  const sign = timeZoneDiff.at(0);
  // + to change into number
  const laggedMinute = +timeZoneDiff.split(':').at(1);
  const startTimeMs = new Date(dirtyStartTime).getTime();
  let newDate;
  if (laggedMinute > 30) {
    if (sign === '+') {
      newDate = new Date(startTimeMs - (60 - laggedMinute) * 60000);
    }
    // JUST A ALGORITHMMMM
    if (sign === '-') {
      newDate = new Date(startTimeMs + (60 - laggedMinute) * 60000);
    }
  }
  if (laggedMinute < 30) {
    if (sign === '+') {
      newDate = new Date(startTimeMs + laggedMinute * 60000);
    }
    if (sign === '-') {
      newDate = new Date(startTimeMs - laggedMinute * 60000);
    }
  }
  const localeDate = newDate.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const [date, time] = localeDate.split(',');
  // console.log(date, time);
  // Because it is the format of en-Us.
  const [month, day, year] = date.split('/');
  // console.log(`${year}-${month}-${day}${time}`);
  // To convert it into same form as APIs'.
  return `${year}-${month}-${day}${time}`;
};
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
    },
    awayTeam: {
      name: awayTeamName,
      imageUrl: `https://api.sofascore.app/api/v1/team/${awayTeamId}/image`,
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
  console.log(standings);
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
const getIncident = (incidentNum) => {
  const incidentMap = new Map([
    [63, 'assist'],
    [62, 'canceledGoal'],
    [47, 'goal'],
    [70, 'ownGoal'],
    [57, 'penalty'],
    [38, 'missedPenalty'],
    [39, 'ownGoal'],
    [37, 'penalty'],
    [45, 'redCard'],
    [43, 'yellowCard'],
    [36, 'goal'],
    [40, 'shootOutMissedPen'],
    [41, 'shootOutPen'],
  ]);
  // If we get unknown number
  const incident = incidentMap.get(incidentNum) || 'Unknown';
  return incident;
};
module.exports = {
  getMatchDate,
  checkWickets,
  refineInnings,
  API_KEY,
  footballApiOptions,
  sportApiOptions,
  getFootballStandings,
  refineStandings,
  refineEvents,
  refineFootballDate,
  topClubs,
  getIncident,
};
