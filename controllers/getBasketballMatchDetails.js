const { fetchData, getMatchDate } = require('../util/api-helper');
const { refineBasketballLineups } = require('../util/match-detail-helper');

exports.getBasketballInfo = async (matchId) => {
  const url = `https://sofasport.p.rapidapi.com/v1/events/data?event_id=${matchId}`;
  const data = await fetchData(url, 'basketball info');
  const {
    homeTeam: { name: homeTeam },
    awayTeam: { name: awayTeam },
    venue,
    homeScore: { period1, period2, period3, period4 },
    awayScore: {
      period1: awayPeriod1,
      period2: awayPeriod2,
      period3: awayPeriod3,
      period4: awayPeriod4,
    },
    startTimestamp,
  } = data;
  const {
    stadium: { name: stadiumName },
    city: { name: cityName },
  } = venue || { stadium: {}, city: {} };
  const refinedVenue = venue && `${stadiumName},${cityName}`;
  const startDate = getMatchDate(startTimestamp);
  const awayScore = {
    period1: awayPeriod1,
    period2: awayPeriod2,
    period3: awayPeriod3,
    period4: awayPeriod4,
  };
  return {
    homeTeam,
    awayTeam,
    venue: refinedVenue,
    homeScore: { period1, period2, period3, period4 },
    awayScore,
    startDate,
  };
};
exports.getBasketballStats = async (matchId) => {
  const url = `https://sofasport.p.rapidapi.com/v1/events/statistics?event_id=${matchId}`;
  const data = await fetchData(url, 'stats');
  const { groups } = data.find((el) => el.period === 'ALL');
  // Maybe bad practice but i assume that it is in the following order and always contains three stats.
  const [
    { statisticsItems: dirtyScoringStats },
    { statisticsItems: dirtyOtherStats },
    { statisticsItems: dirtyLeadStats },
  ] = groups;
  const refineStats = (statsContainer) => {
    const { name: stat, home, away } = statsContainer;
    return { stat, home, away };
  };
  const scoringStats = dirtyScoringStats.map((statsContainer) =>
    refineStats(statsContainer)
  );
  const otherStats = dirtyOtherStats.map((statsContainer) =>
    refineStats(statsContainer)
  );
  const leadStats = dirtyLeadStats.map((statsContainer) =>
    refineStats(statsContainer)
  );
  return { scoringStats, otherStats, leadStats };
};
exports.getBasketballLineups = async (matchId) => {
  const url = `https://sofasport.p.rapidapi.com/v1/events/lineups?event_id=${matchId}`;
  const {
    home: { players: homePlayers },
    away: { players: awayPlayers },
  } = await fetchData(url, 'lineups');
  const refinedHomePlayers = homePlayers.map((playerSet) =>
    refineBasketballLineups(playerSet)
  );
  const refinedAwayPlayers = awayPlayers.map((playerSet) =>
    refineBasketballLineups(playerSet)
  );
  return { home: refinedHomePlayers, away: refinedAwayPlayers };
};
