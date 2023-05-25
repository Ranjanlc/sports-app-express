const {
  footballApiOptions,
  getIncident,
  getFootballStandings,
  refinePlayerName,
} = require('../util/transform-data');
const BASE_URL = 'https://livescore-sports.p.rapidapi.com/v1/events';
const getInfo = async (matchId) => {
  const url = `${BASE_URL}/info?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  console.log(res);
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
  const {
    DATA: { LINEUPS: lineups, SUBSTITUTIONS: subs },
  } = await res.json();
  const refinedLineups = lineups.map((el) => {
    const {
      TEAM_NUMBER: team,
      PLAYERS: dirtyPlayerSet,
      STANDING_FORMATIONS: formation,
    } = el;
    const playerSet = dirtyPlayerSet.reduce(
      (acc, playerSet) => {
        // console.log(acc);
        const {
          PLAYER_ID: playerId,
          PLAYER_FIRST_NAME: playerFirstName,
          PLAYER_LAST_NAME: playerLastName,
          FORMAT_POSITION: formatPosition,
          PLAYER_NUMBER: playerNumber,
          PLAYER_POSITION_NAME: playerPos,
        } = playerSet;
        if (playerPos !== 'COACH') {
          acc.players.push({
            playerId,
            // To remove undefined from the player that only has one name
            playerName: playerFirstName
              ? `${playerFirstName} ${playerLastName}`
              : playerLastName,
            formatPosition: formatPosition
              ? formatPosition
              : 'substitutePlayer',
            playerNumber,
          });
          return acc;
        }
        if (playerPos === 'COACH') {
          acc.coach = `${playerFirstName} ${playerLastName}`;
          return acc;
        }
      },
      { players: [], coach: '' }
    );
    const { players, coach } = playerSet;
    return { team, formation, players, coach };
  });
  console.log(refinedLineups);
  const flatSubs = Object.values(subs).flat();
  const subsContainer = [];
  // console.log(flatSubs);
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
const refineStats = (slug) => {
  const splittedSlug = slug.split('_');
  const slugLength = splittedSlug.length;
  let camelCaseStat, displayStat;
  if (slugLength === 1) {
    camelCaseStat = slug.toLowerCase();
    displayStat = slug.slice(0, 1) + slug.slice(1).toLowerCase();
  }
  if (slugLength !== 1) {
    const intermediateCamelSlug = splittedSlug
      .map((el) => el.slice(0, 1) + el.slice(1).toLowerCase())
      .join('');
    camelCaseStat =
      intermediateCamelSlug.slice(0, 1).toLowerCase() +
      intermediateCamelSlug.slice(1);
    const intermediateDisplaySlug = splittedSlug
      .map((el) => el.toLowerCase())
      .join(' ');
    displayStat =
      intermediateDisplaySlug.slice(0, 1).toUpperCase() +
      intermediateDisplaySlug.slice(1);
  }
  return { camelCaseStat, displayStat };
};
const getStats = async (matchId) => {
  const url = `${BASE_URL}/statistics?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
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
  console.log(statsList);
  const statsContainer = [];
  statsList.forEach((stat) => {
    const { camelCaseStat, displayStat } = refineStats(stat);
    // console.log(camelCaseStat, displayStat);
    statsContainer.push({
      stat: displayStat,
      home: homeTeam[camelCaseStat],
      away: awayTeam[camelCaseStat],
    });
  });
  // console.log(statsContainer);
  return statsContainer;
};
const getSummary = async (matchId) => {
  const url = `${BASE_URL}/incidents?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
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
  const incidents = Object.values(dirtyIncidents).map((incidentSet) => {
    // console.log(incidentSet);
    const incident = incidentSet.map((el) => {
      const {
        MINUTE: minute,
        NAME: team,
        MINUTE_EXTENDED: minuteExtended,
        PLAYER_NAME: playerName,
        INCIDENT_TYPE: incidentType,
        SCORE: score,
        INCIDENTS: innerIncidents,
      } = el;
      const baseObj = { minute, team, minuteExtended };
      if (!score) {
        baseObj.playerName = refinePlayerName(playerName);
        baseObj.incident = getIncident(incidentType);
      }
      if (score && incidentType) {
        baseObj.playerName = refinePlayerName(playerName);
        baseObj.incident = getIncident(incidentType);
        baseObj.hasAssisted = false;
        baseObj.score = score;
      }
      if (score && innerIncidents) {
        const [{ PLAYER_NAME: scorer }, { PLAYER_NAME: assister }] =
          innerIncidents;
        baseObj.hasAssisted = true;
        baseObj.scorer = refinePlayerName(scorer);
        baseObj.assister = refinePlayerName(assister);
        baseObj.incident = 'goal';
        baseObj.score = score;
      }
      // console.log(baseObj);
      return baseObj;
    });
    return incident;
  });
  const [firstHalfIncidents, secondHalfIncidents] = incidents;
  const baseObj = {
    homeFTScore,
    awayFTScore,
    homeHTScore,
    awayHTScore,
    firstHalfIncidents,
    secondHalfIncidents,
  };
  if (incidents.length === 2) {
    return baseObj;
  }
  if (incidents.length === 4) {
    const [__, _, extraFirstHalfIncidents, extraSecondHalfIncidents] =
      incidents;
    const penaltyShootout = [];
    extraSecondHalfIncidents.forEach((incidentSet) => {
      const { incident, playerName, score, team } = incidentSet;
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
    const error = new Error("Can't fetch standings");
    error.code = 404;
    throw error;
  }
  const { DATA: standingData } = await res.json();
  // console.log(res);
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
