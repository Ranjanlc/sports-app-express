// const fetch = require('node-fetch');
// const API_KEY = '8acd2e89a2mshe39f55bfd24361bp10e3fdjsnf764c88cfede';

const { getMatches, getFootballMatches } = require('../controllers/getMatches');
const {
  getFootballCompDetails,
  getCompetitionDetails,
  getCompetitionMatches,
} = require('../controllers/getCompDetails');
const {
  getInfo,
  getStats,
  getLineups,
  getSummary,
} = require('../controllers/getFootballMatchDetails');

exports.getFootballMatches = ({ date, timeZoneDiff }) => {
  return getFootballMatches(date, timeZoneDiff);
};
exports.getBasketballMatches = ({ date }) => {
  return getMatches(date, 'basketball');
};
exports.getCricketMatches = ({ date }) => {
  return getMatches(date, 'cricket');
};
exports.getLiveFootballMatches = async () => {
  return getFootballMatches({}, null, true);
};
exports.getLiveBasketballMatches = async () => {
  return getMatches({}, 'basketball', true);
};
exports.getLiveCricketMatches = async () => {
  return getMatches({}, 'cricket', true);
};
exports.getFootballDetails = ({ compId }) => {
  return getFootballCompDetails(compId);
};
// TODO:handle the case where there is no  standings.
exports.getBasketballDetails = async ({ uniqueId, dateState = 'next' }) => {
  return getCompetitionDetails('basketball', uniqueId, dateState);
};
exports.getCricketDetails = async ({
  compId,
  dateState = 'next',
  uniqueId,
}) => {
  return getCompetitionDetails('cricket', compId, dateState, uniqueId);
};
exports.getBasketballCompMatches = async ({
  uniqueId,
  appSeasonId,
  dateState = 'next',
  page = 0,
}) => {
  return getCompetitionMatches(
    'basketball',
    uniqueId,
    appSeasonId,
    dateState,
    page
  );
};
exports.getCricketCompMatches = async ({
  compId,
  uniqueId,
  appSeasonId,
  dateState = 'next',
  page = 0,
}) => {
  return getCompetitionMatches(
    'cricket',
    compId,
    appSeasonId,
    dateState,
    page,
    uniqueId
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
