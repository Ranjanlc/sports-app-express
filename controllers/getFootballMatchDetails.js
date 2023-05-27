const { footballApiOptions, handleError } = require('../util/transform-data');
const { getFootballStandings } = require('../util/competition-helper');
const {
  refineStats,
  refineLineups,
  refineIncidents,
} = require('../util/match-detail-helper');
const BASE_URL = 'https://livescore-sports.p.rapidapi.com/v1/events';
const getInfo = async (matchId) => {
  const url = `${BASE_URL}/info?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  if (res.status === 404) {
    handleError('info');
  }
  const {
    DATA: {
      VENUE_NAME: venue,
      SPECTATORS_NUMBER: spectators,
      REFS: [{ NAME: refName, REFEREE_COUNTRY_NAME: refCountry }],
      MATCH_START_DATE: matchStartDate,
    },
  } = await res.json();
  // The slicing coz we get date in a weird format.
  const dirtyStartDate = String(matchStartDate).slice(0, 8);
  const slicedDate = `${dirtyStartDate.slice(0, 4)}-${dirtyStartDate.slice(
    4,
    6
  )}-${dirtyStartDate.slice(6, 8)}`;
  // en-UK coz it looks more suitable
  const startDate = new Date(slicedDate).toLocaleString('en-UK', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  return { venue, spectators, refName, refCountry, startDate };
};
const getLineups = async (matchId) => {
  const url = `${BASE_URL}/lineups?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  if (res.status === 404) {
    handleError('lineups');
  }
  const {
    DATA: { LINEUPS: lineups, SUBSTITUTIONS: subs },
  } = await res.json();
  const refinedLineups = refineLineups(lineups);
  if (!subs) {
    return { lineups: refinedLineups };
  }
  const flatSubs = Object.values(subs).flat();
  const subsContainer = [];
  for (i = 0; i < flatSubs.length; i++) {
    for (j = i + 1; j < flatSubs.length; j++) {
      if (flatSubs[i].OTHER_PLAYER_ID === flatSubs[j].PLAYER_ID) {
        const {
          MINUTE: minute,
          NAME: team,
          PLAYER_NAME: subOutPlayerName,
          PLAYER_ID: subOutPlayerId,
          OTHER_PLAYER_ID: subInPlayerId,
          MINUTE_EXTENDED: minuteExtended,
        } = flatSubs[i];
        subsContainer.push({
          minute,
          team,
          subInPlayerId,
          subOutPlayerId,
          subOutPlayerName,
          subInPlayerName: flatSubs[j].PLAYER_NAME,
          minuteExtended,
        });
      }
    }
  }
  return { lineups: refinedLineups, subs: subsContainer };
};
const getStats = async (matchId) => {
  const url = `${BASE_URL}/statistics?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  if (res.status === 404) {
    handleError('stats');
  }
  const {
    DATA: { STATISTICS: statistics },
  } = await res.json();
  const refinedStatistics = statistics.map((el) => {
    const {
      TEAM_NUMBER: team,
      FOULS: fouls,
      THROW_INS: throwIns,
      OFFSIDES: offsides,
      POSSESSION: possession,
      CROSSES: crosses,
      CORNER_KICKS: cornerKicks,
      YELLOW_CARDS: yellowCards,
      RED_CARDS: redCards,
      SHOTS_ON_TARGET: shotsOnTarget,
      SHOTS_OFF_TARGET: shotsOffTarget,
    } = el;
    return {
      team,
      fouls,
      throwIns,
      offsides,
      possession,
      crosses,
      cornerKicks,
      yellowCards,
      redCards,
      shotsOnTarget,
      shotsOffTarget,
    };
  });
  const homeTeam = refinedStatistics.find((el) => el.team === 1);
  const awayTeam = refinedStatistics.find((el) => el.team === 2);
  const statsList = Object.keys(statistics.at(0)).filter(
    (el) =>
      !(el === 'TREATMENTS') &&
      !(el === 'Shwd') &&
      !(el === 'BLOCKED_SHOTS') &&
      !(el === 'COUNTER_ATTACKS') &&
      !(el === 'YRcs') &&
      !(el === 'GOALKEEPER_SAVES') &&
      !(el === 'GOAL_KICKS') &&
      !(el === 'TEAM_NUMBER')
  );
  const statsContainer = [];
  statsList.forEach((stat) => {
    const { camelCaseStat, displayStat } = refineStats(stat);
    statsContainer.push({
      stat: displayStat,
      home: homeTeam[camelCaseStat],
      away: awayTeam[camelCaseStat],
    });
  });
  return statsContainer;
};
const getSummary = async (matchId) => {
  const url = `${BASE_URL}/incidents?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  if (res.status === 404) {
    handleError(summary);
  }
  const {
    DATA: {
      HOME_SCORE: homeScore,
      AWAY_SCORE: awayScore,
      HOME_FULL_TIME_SCORE: homeFTScore,
      AWAY_FULL_TIME_SCORE: awayFTScore,
      HOME_HALF_TIME_SCORE: homeHTScore,
      AWAY_HALF_TIME_SCORE: awayHTScore,
      HOME_PENALTY_SHOOT_OUT_PERIOD_SCORE: homeShootoutScore,
      AWAY_PENALTY_SHOOT_OUT_PERIOD_SCORE: awayShootoutScore,
      INCIDENTS: dirtyIncidents,
    },
  } = await res.json();
  const incidents = refineIncidents(dirtyIncidents);
  console.log(incidents);
  const [firstHalfIncidents, secondHalfIncidents] = incidents;
  const baseObj = {
    homeFTScore,
    awayFTScore,
    homeHTScore,
    awayHTScore,
    firstHalfIncidents,
    secondHalfIncidents,
  };
  if (incidents.length <= 2) {
    return baseObj;
  }
  // There is extra time and possibly penalty
  if (incidents.length === 4) {
    const [__, _, extraFirstHalfIncidents, extraSecondHalfIncidents] =
      incidents;
    const penaltyShootout = [];
    extraSecondHalfIncidents.forEach((incidentSet) => {
      const { incident, playerName, score, team } = incidentSet;
      // Checking if pen shootout happened
      if (incident === 'shootOutPen' || incident === 'shootOutMiss') {
        penaltyShootout.push({ incident, playerName, score, team });
      }
    });
    if (penaltyShootout.length !== 0) {
      return {
        ...baseObj,
        extraTimeIncidents: [
          extraFirstHalfIncidents,
          extraSecondHalfIncidents.filter(
            (incidentSet) =>
              !(incidentSet.incident === 'shootOutPen') &&
              !(incidentSet.incident === 'shootOutMiss')
          ),
        ].flat(),
        penaltyShootout,
        homeScore,
        awayScore,
        homeShootoutScore,
        awayShootoutScore,
      };
    }
    return {
      ...baseObj,
      extraTimeIncidents: [
        extraFirstHalfIncidents,
        extraSecondHalfIncidents,
      ].flat(),
      homeScore,
      awayScore,
    };
  }
};
const getTable = async (compId) => {
  const res = await fetch(
    `https://livescore-sports.p.rapidapi.com/v1/competitions/standings?timezone=0&competition_id=${compId}&locale=EN`,
    footballApiOptions
  );
  if (res.status === 404) {
    handleError('standings');
  }
  const { DATA: standingData } = await res.json();
  let standings;
  if (standingData.length === 0) standings = [];
  if (standingData.length > 1) {
    // flatMap coz there would be two arrays,one from the map itself and from destructureStandings and as it doesnt fit schema,we flatMap.
    standings = standingData.flatMap((item) => {
      return getFootballStandings(item, true);
    });
  }
  if (standingData.length === 1) {
    standings = getFootballStandings(standingData[0]);
  }
  return standings;
};
module.exports = { getLineups, getInfo, getStats, getSummary, getTable };
