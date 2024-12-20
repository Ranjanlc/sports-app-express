const {
  footballApiOptions,
  sportApiOptions,
  handleError,
} = require('../util/transform-data');
const {
  refineEvents,
  refineStandings,
  getFootballStandings,
} = require('../util/competition-helper');
const { fetchData } = require('../util/api-helper');
const getFootballURL = (compId, mode) => {
  return `https://livescore-sports.p.rapidapi.com/v1/competitions/${mode}?timezone=0&competition_id=${compId}&locale=EN`;
};
const getFootballCompDetails = async (compId) => {
  const errors = [];
  const res = await fetch(
    getFootballURL(compId, 'details'),
    footballApiOptions
  );
  const res1 = await fetch(
    getFootballURL(compId, 'standings'),
    footballApiOptions
  );
  if (res.status === 404 || res.status === 429 || res.status === 403) {
    errors.push('matches');
  }
  if (res1.status === 404) {
    errors.push('standings');
  }
  if (errors.length > 1) {
    handleError(errors.join('and'));
  }
  const {
    DATA: { STAGES },
  } = await res.json();
  const { DATA: standingData } = await res1.json();
  let standings;
  if (standingData.length === 0 || !standingData) standings = [];
  if (standingData.length > 1) {
    // flatMap coz there would be two arrays,one from the map itself and from destructureStandings and as it doesnt fit schema,we flatMap.
    standings = standingData.flatMap((item) => {
      return getFootballStandings(item, true);
    });
  }
  if (standingData.length === 1) {
    standings = getFootballStandings(standingData[0]);
  }

  const { EVENTS: events } = STAGES.at(0);
  if (!events) return { standings };
  const matches = { fixtures: [], results: [] };
  events.forEach((unfilteredEvent) => {
    const {
      MATCH_ID: matchId,
      HOME_TEAM: homeTeam,
      AWAY_TEAM: awayTeam,
      MATCH_START_DATE: startTime,
      MATCH_STATUS: matchStatus,
      HOME_SCORE: homeScore,
      AWAY_SCORE: awayScore,
      WHICH_TEAM_WON: winnerTeam,
    } = unfilteredEvent;
    const event = {
      matchId,
      homeTeam: {
        name: homeTeam.at(0).NAME,
        imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
          homeTeam.at(0).BADGE_ID
        }.png`,
        id: homeTeam.at(0).ID,
      },
      awayTeam: {
        name: awayTeam.at(0).NAME,
        imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
          awayTeam.at(0).BADGE_ID
        }.png`,
        id: awayTeam.at(0).ID,
      },
      startTime,
      matchStatus,
      winnerTeam,
    };
    if (matchStatus !== 'NS') {
      event.homeScore = homeScore;
      event.awayScore = awayScore;
      matches.results.unshift(event);
    } else {
      matches.fixtures.push(event);
    }
  });

  return { matches, standings };
};
// It is for initial loading and we will be loading fixtures and page 0 at start.
const getCompetitionDetailHandler = async (sport, id, dateState, uniqueId) => {
  // All this uniqueId and id stuff just to load cricket data with tournament id and as matches needs uniquetournament,we pass it extra too.But with basketball,we fetch it with uniqueId which is simply under id.
  const errors = [];
  let standingSet;
  const matches = [];
  let hasNextPage = false;
  const res = await fetch(
    `https://sofasport.p.rapidapi.com/v1/${
      sport === 'cricket' ? 'tournaments' : 'unique-tournaments'
    }/seasons?${
      sport === 'cricket' ? 'tournament_id' : 'unique_tournament_id'
    }=${sport === 'cricket' ? id : uniqueId}`,
    sportApiOptions
  );
  if (res.status === 404 || res.status === 429 || res.status === 403) {
    handleError('Sorry,internal server error', 500);
  }
  const { data } = await res.json();
  const seasons = sport === 'basketball' ? data : data.seasons;
  const seasonId = seasons.at(0).id;
  const standingRes = await fetch(
    `https://sofasport.p.rapidapi.com/v1/seasons/standings?standing_type=total&seasons_id=${seasonId}&unique_tournament_id=${uniqueId}`,
    sportApiOptions
  );
  if (standingRes.status === 404 || standingRes.status === 429) {
    errors.push('standings');
  }
  const matchRes = await fetch(
    `https://sofasport.p.rapidapi.com/v1/seasons/events?course_events=${dateState}&page=0&seasons_id=${seasonId}&unique_tournament_id=${uniqueId}`,
    sportApiOptions
  );
  if (matchRes.status === 404 || matchRes.status === 429) {
    errors.push('matches');
  }
  if (errors.length > 1) {
    // If both  failed to fetch
    handleError(errors.join('and'));
  }
  const { data: standingData } = await standingRes.json();
  const { data: matchData } = await matchRes.json();
  if (standingData) {
    if (standingData.length === 1) {
      standingSet = { standings: refineStandings(standingData[0], sport) };
    }
    if (standingData.length >= 1) {
      standingSet = standingData.map((compData) => {
        return {
          groupName: compData.name,
          standings: refineStandings(compData, sport),
        };
      });
    }
  }
  if (!matchData) return { seasonId, standingSet };
  if (matchData) {
    const { events, hasNextPage: matchHasNextPage } = matchData;
    // Setting the variables value;
    hasNextPage = matchHasNextPage;
    events.forEach((boilerData) => {
      const event = refineEvents(boilerData, sport, dateState);
      if (dateState === 'last') {
        matches.unshift(event);
      }
      if (dateState === 'next') {
        // TODO:If running matches are on this set,do necessary things to fine-tune it.
        matches.push(event);
      }
    });
  }
  return { matchSet: { matches, hasNextPage }, seasonId, standingSet };
};
const getCompetitionMatches = async (
  sport,
  uniqueId,
  appSeasonId,
  dateState,
  page
) => {
  const url = `https://sofasport.p.rapidapi.com/v1/seasons/events?course_events=${dateState}&page=${page}&seasons_id=${appSeasonId}&unique_tournament_id=${uniqueId}`;
  const data = await fetchData(url, 'competition matches');
  const { events, hasNextPage } = data;
  const matches = [];
  events.forEach((boilerData) => {
    const event = refineEvents(boilerData, sport, dateState);
    if (dateState === 'last') {
      matches.unshift(event);
    }
    if (dateState === 'next') {
      // TODO:If running matches are on this set,do necessary things to fine-tune it
      matches.push(event);
    }
  });
  return { matches, hasNextPage };
};
module.exports = {
  getFootballCompDetails,
  getCompetitionDetailHandler,
  getCompetitionMatches,
};
