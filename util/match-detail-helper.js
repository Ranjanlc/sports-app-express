const getIncident = (incidentNum) => {
  const incidentMap = new Map([
    [63, 'assist'],
    [62, 'canceledGoal'],
    [47, 'goal'],
    [70, 'ownGoal'],
    [57, 'penalty'],
    [38, 'missedPenalty'],
    [39, 'ownGoal'],
    [37, 'penalty'],
    [45, 'redCard'],
    [43, 'yellowCard'],
    [36, 'goal'],
    [40, 'shootOutMiss'],
    [41, 'shootOutPen'],
  ]);
  // If we get unknown number
  const incident = incidentMap.get(incidentNum) || 'Unknown';
  return incident;
};
const refinePlayerNameStats = (name) => {
  const splittedName = name.split(' ');
  const splittedNameLength = splittedName.length;
  if (splittedNameLength === 1) return name;
  if (splittedNameLength === 2) {
    return `${splittedName[0].slice(0, 1)}.${splittedName[1]}`;
  }
  if (splittedNameLength === 3) {
    return `${splittedName[0].slice(0, 1)}.${splittedName[1]}${
      splittedName[2]
    }`;
  }
  if (splittedNameLength >= 3) {
    return `${splittedName[0]} ${splittedName.at(-1)}`;
  }
};
const refinePlayerNameLineup = (name) => {
  const splittedName = name.split(' ');
  if (splittedName.length <= 2) return name;
  if (name.length <= 20) return name;
  if (name.length >= 20) {
    return `${splittedName.at(0)} ${splittedName.at(-1)}`;
  }
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
const refineIncidents = (dirtyIncidents) => {
  if (!dirtyIncidents) return null;
  const incident = dirtyIncidents.map((el) => {
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
      baseObj.playerName = refinePlayerNameStats(playerName);
      baseObj.incident = getIncident(incidentType);
    }
    if (score && incidentType) {
      baseObj.playerName = refinePlayerNameStats(playerName);
      baseObj.incident = getIncident(incidentType);
      baseObj.hasAssisted = false;
      baseObj.score = score;
    }
    if (score && innerIncidents) {
      const [{ PLAYER_NAME: scorer, INCIDENT_TYPE: incidentType }] =
        innerIncidents;
      if (innerIncidents.length === 2) {
        const assister = innerIncidents[1].PLAYER_NAME;
        baseObj.hasAssisted = true;
        baseObj.assister = refinePlayerNameStats(assister);
      }
      baseObj.scorer = refinePlayerNameStats(scorer);
      baseObj.incident = getIncident(incidentType);
      baseObj.score = score;
    }
    return baseObj;
  });
  return incident;
};
const refineLineups = (lineups) => {
  const refinedLineup = lineups.map((el) => {
    const {
      TEAM_NUMBER: team,
      PLAYERS: dirtyPlayerSet,
      STANDING_FORMATIONS: formation,
    } = el;
    const playerSet = dirtyPlayerSet.reduce(
      (acc, playerSet) => {
        const {
          PLAYER_ID: playerId,
          EXTERNAL_ID: externalId,
          PLAYER_FIRST_NAME: playerFirstName,
          PLAYER_LAST_NAME: playerLastName,
          FORMAT_POSITION: formatPosition,
          PLAYER_NUMBER: playerNumber,
          PLAYER_POSITION_NAME: playerPos,
        } = playerSet;
        if (playerPos !== 'COACH') {
          acc.players.push({
            playerId: playerId ? playerId : externalId,
            // To remove undefined from the player that only has one name
            playerName: playerFirstName
              ? refinePlayerNameLineup(`${playerFirstName} ${playerLastName}`)
              : playerLastName,
            formatPosition: formatPosition
              ? formatPosition
              : 'substitutePlayer',
            playerNumber,
          });
          return acc;
        }
        if (playerPos === 'COACH') {
          acc.coach = refinePlayerNameLineup(
            `${playerFirstName} ${playerLastName}`
          );
          return acc;
        }
      },
      { players: [], coach: '' }
    );
    const { players, coach } = playerSet;
    return { team, formation, players, coach };
  });
  return refinedLineup;
};
const handleShootout = (incidents) => {
  const penaltyShootout = [];
  incidents.forEach((incidentSet) => {
    const { incident, playerName, score, team } = incidentSet;
    // Checking if pen shootout happened
    if (incident === 'shootOutPen' || incident === 'shootOutMiss') {
      penaltyShootout.push({ incident, playerName, score, team });
    }
  });
  return {
    refinedExtraIncidents: incidents.filter(
      (incidentSet) =>
        !(incidentSet.incident === 'shootOutPen') &&
        !(incidentSet.incident === 'shootOutMiss')
    ),
    penaltyShootout,
  };
};
const handleExtraTime1 = (incidents, halfPeriods) => {
  const isFirstHalf = halfPeriods.some((el) => el === '1');
  if (incidents.length === 3) {
    const [
      fullTimeIncident,
      extraFirstHalfIncidents,
      extraSecondHalfIncidents,
    ] = incidents;
    if (isFirstHalf) {
      return {};
    }
    if (!isFirstHalf) {
    }
    // const [regularIncident]
  }
  const [__, _, extraFirstHalfIncidents, extraSecondHalfIncidents] = incidents;
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
};
module.exports = {
  refineStats,
  refineLineups,
  refineIncidents,
  handleShootout,
};
