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
const {
  getCricketInfo,
  getCricketInnings,
  getCompetitionTable,
} = require('../controllers/getCricketMatchDetails');
const {
  getBasketballInfo,
  getBasketballStats,
  getBasketballLineups,
} = require('../controllers/getBasketballMatchDetails');
// The first and second arguments are parent and args out of which parent represents the result of the previous resolver execution in the resolver chain. For the root resolver, this value is usually undefined or null. ANDDDD, args contains the input arguments directly passed to the graphql query(without using variables)
// The third argument is context which is called everytime the req is sent and it also consits of variables we passed into query. AN Important thing is the variables name is not the argument name. FOr ex: compId:$competitionId is in the query, we cant do variables.compId,we should do variables.competitionId.
exports.getMatchesList = async (_, __, { variables }) => {
  const { date, timeZoneDiff, sportName, isLive } = variables;
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
exports.getFootballDetails = (_, __, { variables }) => {
  return getFootballCompDetails(variables.compId);
};
// TODO:handle the case where there is no  standings.
exports.getCompetitionDetails = async (_, __, { variables }) => {
  const { compId, uniqueId, dateState, isCricket } = variables;
  if (isCricket) {
    return getCompetitionDetailHandler('cricket', compId, dateState, uniqueId);
  }
  if (!isCricket) {
    return getCompetitionDetailHandler('basketball', '_', dateState, uniqueId);
  }
};

exports.getCompMatches = async (_, __, { variables }) => {
  const {
    compId,
    uniqueId,
    appSeasonId,
    dateState,
    page = 0,
    isCricket,
  } = variables;
  return getCompetitionMatches(
    isCricket ? 'cricket' : 'basketball',
    uniqueId,
    appSeasonId,
    dateState,
    page
  );
};
exports.getFootballMatchInfo = async (_, __, { variables }) => {
  return getInfo(variables.matchId);
};
exports.getFootballMatchLineup = async (_, __, { variables }) => {
  return getLineups(variables.matchId);
};
exports.getFootballMatchStats = async (_, __, { variables }) => {
  return getStats(variables.matchId);
};
exports.getFootballMatchSummary = async (_, __, { variables }) => {
  return getSummary(variables.matchId);
};
exports.getFootballMatchTable = async (_, __, { variables }) => {
  return getTable(variables.compId);
};
exports.getCricketMatchInfo = async (_, args, { variables }) => {
  return getCricketInfo(args.matchId);
};
exports.getCricketMatchInnings = async (_, args, { variables }) => {
  return getCricketInnings(args.matchId);
};
exports.getCricketMatchTable = async (_, args, { variables }) => {
  return getCompetitionTable(args.compId, args.uniqueId);
};
exports.getBasketballMatchInfo = async (_, args, { variables }) => {
  return getBasketballInfo(args.matchId);
};
exports.getBasketballMatchStats = async (_, args, { variables }) => {
  return getBasketballStats(args.matchId);
};
exports.getBasketballMatchLineups = async (_, args) => {
  return getBasketballLineups(args.matchId);
};
exports.getBasketballMatchTable = async (_, args) => {
  return getCompetitionTable(_, args.uniqueId, 'basketball');
};
