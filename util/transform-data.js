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
const TOP_CLUBS = {
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
  // Because it is the format of en-Us.
  const [month, day, year] = date.split('/');
  // To convert it into same form as APIs'.
  return `${year}-${month}-${day}${time}`;
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
const handleError = (name) => {
  const error = new Error(`Can't fetch ${name}`);
  error.code = 404;
  throw error;
};
module.exports = {
  getMatchDate,
  checkWickets,
  refineInnings,
  API_KEY,
  footballApiOptions,
  sportApiOptions,
  refineFootballDate,
  TOP_CLUBS,
  handleError,
};
