const { GraphQLError } = require("graphql");

const footballApiOptions = {
  headers: {
    'X-RapidAPI-Key': process.env.API_KEY,
    'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
  },
};
const sportApiOptions = {
  headers: {
    'X-RapidAPI-Key': process.env.API_KEY,
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

const checkWickets = (wickets, forDisplay = true) => {
  if (!forDisplay) {
    return wickets === 10 ? null : wickets;
  }
  return `${wickets === 10 || wickets === 0 ? '' : `/${wickets}`}`;
};

const refineInnings = (homeScore, awayScore, forDisplay = 'true') => {
  const { display: homeDisplay, innings: homeInnings } = homeScore;
  const { display: awayDisplay, innings: awayInnings } = awayScore;
  const homeInningsRefined = homeInnings
    ? homeInnings
    : {
        inning1: {
          score: 0,
          wickets: 0,
          overs: 0,
        },
      };
  const awayInningsRefined = awayInnings
    ? awayInnings
    : {
        inning1: {
          score: 0,
          wickets: 0,
          overs: 0,
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

  // IT will obviously be test match if it reaches here
  if (forDisplay) {
    let displayHomeScore, displayAwayScore;
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
      displayHomeScore = homeScore.innings
        ? `${home1stScore}${checkWickets(home1stWickets)} (${home1stOvers})`
        : 'Yet to bat';
      displayAwayScore = awayScore.innings
        ? `${away1stScore}${checkWickets(away1stWickets)} (${away1stOvers})`
        : 'Yet to bat';
    }
    return { displayHomeScore, displayAwayScore };
  }
  if (!forDisplay) {
    if (homeInning2 || awayInning2) {
      const home = {
        inning1Score: home1stScore,
        inning2Score: homeInning2?.score,
        overs: home1stOvers + (homeInning2?.overs ?? 0),
        wickets: {
          inning1: checkWickets(home1stWickets, false),
          inning2: checkWickets(homeInning2?.wickets ?? 0, false),
        },
      };
      const away = {
        inning1Score: away1stScore,
        inning2Score: awayInning2?.score,
        overs: away1stOvers + (awayInning2?.overs ?? 0),
        wickets: {
          inning1: checkWickets(away1stWickets, false),
          inning2: checkWickets(awayInning2?.wickets ?? 0, false),
        },
      };
      return { home, away };
    }

    if (!(homeInning2 || awayInning2)) {
      const home = {
        inning1Score: home1stScore,
        overs: home1stOvers,
        wickets: { inning1: checkWickets(home1stWickets, false) },
      };
      const away = {
        inning1Score: away1stScore,
        overs: away1stOvers,
        wickets: { inning1: checkWickets(away1stWickets, false) },
      };
      return { home, away };
    }
  }
};
const handleError = (name) => {
  const error = new GraphQLError(`Can't fetch ${name}`);
  error.code = 404;
  throw error;
};
module.exports = {
  checkWickets,
  refineInnings,
  footballApiOptions,
  sportApiOptions,
  TOP_CLUBS,
  handleError,
};
