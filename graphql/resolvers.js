// const fetch = require('node-fetch');
// const API_KEY = '8acd2e89a2mshe39f55bfd24361bp10e3fdjsnf764c88cfede';

const { getMatches, getFootballMatches } = require('../controllers/getMatches');
const {
  getFootballCompDetails,
  getCompetitionDetails,
} = require('../controllers/getCompDetails');

exports.getFootballMatches = ({ date }) => {
  return getFootballMatches(date);
};
exports.getBasketballMatches = ({ date }) => {
  return getMatches(date, 'basketball');
};
exports.getCricketMatches = ({ date }) => {
  return getMatches(date, 'cricket');
};
exports.getLiveFootballMatches = async () => {
  return getFootballMatches({}, true);
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
exports.getBasketballDetails = async ({
  uniqueId,
  appSeasonId,
  dateState = 'next',
  page = 0,
}) => {
  return getCompetitionDetails(
    'basketball',
    uniqueId,
    appSeasonId,
    dateState,
    page
  );
};
exports.getCricketDetails = async ({
  compId,
  uniqueId,
  appSeasonId,
  dateState = 'next',
  page = 0,
}) => {
  return getCompetitionDetails(
    'cricket',
    compId,
    appSeasonId,
    dateState,
    page,
    uniqueId
  );
};
