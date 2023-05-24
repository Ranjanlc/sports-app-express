const { footballApiOptions, getIncident } = require('../util/transform-data');
const BASE_URL = 'https://livescore-sports.p.rapidapi.com/v1/events';
const getInfo = async (matchId) => {
  const url = `${BASE_URL}/info?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  const {
    DATA: {
      VENUE_NAME: venue,
      SPECTATORS_NUMBER: spectators,
      REFS: [{ NAME: refName, REFEREE_COUNTRY_NAME: refCountry }],
    },
  } = await res.json();
  return { venue, spectators, refName, refCountry };
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
      THROW_INS: throws,
      OFFSIDES: offsides,
      POSSESSION: possession,
      CROSSES: crosses,
      CORNER_KICKS: corners,
      YELLOW_CARDS: yellowCards,
      RED_CARDS: redCards,
      SHOTS_ON_TARGET: shotsOnTarget,
      SHOTS_OFF_TARGET: shotsOffTarget,
    } = el;
    return {
      team,
      fouls,
      throws,
      offsides,
      possession,
      crosses,
      corners,
      yellowCards,
      redCards,
      shotsOnTarget,
      shotsOffTarget,
    };
  });
  const homeTeam = refinedStatistics.find((el) => el.team === 1);
  const awayTeam = refinedStatistics.find((el) => el.team === 2);
  const statsList = Object.keys(homeTeam);
  console.log(statsList);
  const statsContainer = [];
  statsList.forEach((stat) => {
    if (stat === 'team') return;
    statsContainer.push({ stat, home: homeTeam[stat], away: awayTeam[stat] });
  });
  console.log(statsContainer);
  return statsContainer;
};
const getSummary = async (matchId) => {
  const url = `${BASE_URL}/incidents?sport=soccer&event_id=${matchId}&locale=EN`;
  const res = await fetch(url, footballApiOptions);
  const {
    DATA: {
      HOME_SCORE: homeFTScore,
      AWAY_SCORE: awayFTScore,
      HOME_HALF_TIME_SCORE: homeHTScore,
      AWAY_HALF_TIME_SCORE: awayHTScore,
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
        baseObj.playerName = playerName;
        baseObj.incident = getIncident(incidentType);
      }
      if (score && incidentType) {
        baseObj.playerName = playerName;
        baseObj.incident = getIncident(incidentType);
        baseObj.hasAssisted = false;
        baseObj.score = score;
      }
      if (score && innerIncidents) {
        const [{ PLAYER_NAME: scorer }, { PLAYER_NAME: assister }] =
          innerIncidents;
        baseObj.hasAssisted = true;
        baseObj.scorer = scorer;
        baseObj.assister = assister;
        baseObj.incident = 'goal';
      }
      // console.log(baseObj);
      return baseObj;
    });
    return incident;
  });
  const [firstHalfIncidents, secondHalfIncidents] = incidents;
  return {
    homeFTScore,
    awayFTScore,
    homeHTScore,
    awayHTScore,
    firstHalfIncidents,
    secondHalfIncidents,
  };
};
module.exports = { getLineups, getInfo, getStats, getSummary };
