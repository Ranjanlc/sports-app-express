// const fetch = require('node-fetch');
// const API_KEY = '8acd2e89a2mshe39f55bfd24361bp10e3fdjsnf764c88cfede';

const { getMatches, getFootballMatches } = require('../controllers/getMatches');
const {
  getFootballCompDetails,
  getCompetitionDetailHandler,
  getCompetitionMatches,
} = require('../controllers/getCompDetails');
const {
  getInfo,
  getStats,
  getLineups,
  getSummary,
  getTable,
} = require('../controllers/getFootballMatchDetails');

exports.getMatchesList = async ({
  date,
  timeZoneDiff,
  sportName,
  isLive,
  isCricket,
}) => {
  if (sportName === 'football') {
    if (!isLive) {
      return getFootballMatches(date, timeZoneDiff);
    } else {
      return getFootballMatches('_', '_', true);
    }
  }
  if (sportName !== 'football') {
    if (isLive) {
      return getMatches('_', sportName, true);
    } else {
      return getMatches(date, sportName);
    }
  }
};
exports.getFootballDetails = ({ compId }) => {
  return getFootballCompDetails(compId);
};
// TODO:handle the case where there is no  standings.
exports.getCompetitionDetails = async ({
  compId,
  uniqueId,
  dateState,
  isCricket,
}) => {
  console.log(compId, uniqueId, dateState, isCricket);
  if (isCricket) {
    return getCompetitionDetailHandler('cricket', compId, dateState, uniqueId);
  }
  if (!isCricket) {
    return getCompetitionDetailHandler('basketball', '_', dateState, uniqueId);
  }
};

exports.getCompMatches = async ({
  compId,
  uniqueId,
  appSeasonId,
  dateState,
  page = 0,
  isCricket,
}) => {
  return getCompetitionMatches(
    isCricket ? 'cricket' : 'basketball',
    uniqueId,
    appSeasonId,
    dateState,
    page
  );
};
exports.getFootballMatchInfo = async ({ matchId }) => {
  return getInfo(matchId);
};
exports.getFootballMatchLineup = async ({ matchId }) => {
  return getLineups(matchId);
};
exports.getFootballMatchStats = async ({ matchId }) => {
  return getStats(matchId);
};
exports.getFootballMatchSummary = async ({ matchId }) => {
  return getSummary(matchId);
};
exports.getFootballMatchTable = async ({ compId }) => {
  return getTable(compId);
};
