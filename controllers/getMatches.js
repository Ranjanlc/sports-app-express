const {
  getMatchDate,
  refineInnings,
  footballApiOptions,
  sportApiOptions,
  refineFootballDate,
  handleError,
} = require('../util/transform-data');
const { getFeaturedMatches } = require('./getFeaturedMatches');
const getMatches = async (date, sport, live = false) => {
  // Sport id of basketball is 2 and cricket is 62.

  const res = await fetch(
    `https://sofasport.p.rapidapi.com/v1/events/schedule/${
      live ? 'live?' : `date?date=${date}&`
    }sport_id=${sport === 'basketball' ? '2' : '62'}`,
    sportApiOptions
  );
  if (res.status === 404) {
    handleError('cricket/basketball matches');
  }
  const { data } = await res.json();
  if (data?.length === 0) {
    return [];
  }
  const filteredData =
    sport === 'basketball'
      ? data?.filter((comp) => {
          if (comp.tournament.name !== 'NBA Rising Stars Challenge') {
            return comp;
          }
        })
      : data;
  const reducedData = filteredData?.slice(0, 100).reduce((acc, boilerData) => {
    const {
      tournament: {
        name: competitionName,
        id: tournamentId,
        uniqueTournament: { id: uniqueId },
        slug,
        category,
      },
      id: matchId,
      status: { description: matchStatus },
      homeTeam: { name: homeTeamName, id: homeTeamId },
      awayTeam: { name: awayTeamName, id: awayTeamId },
      homeScore, //complexity coz of API's name.
      awayScore,
      winnerCode: winnerTeam,
      startTimestamp,
    } = boilerData;
    const event = {
      matchId,
      matchStatus: matchStatus,
      homeTeam: {
        name: homeTeamName,
        imageUrl: `https://api.sofascore.app/api/v1/team/${homeTeamId}/image`,
        id: homeTeamId,
      },
      awayTeam: {
        name: awayTeamName,
        imageUrl: `https://api.sofascore.app/api/v1/team/${awayTeamId}/image`,
        id: awayTeamId,
      },
      startTime: getMatchDate(startTimestamp),
    };
    // If basketball,same obj as baseEvent,if cricket: a property with baseEvent with space to expand.
    if (
      !(
        matchStatus === 'Not started' ||
        matchStatus === 'Abandoned' ||
        matchStatus === 'Interrupted'
      )
    ) {
      // event.startTime = matchStatus;
      if (matchStatus === 'Ended') event.winnerTeam = winnerTeam;
      if (sport === 'basketball') {
        event.homeScore = homeScore.display;
        event.awayScore = awayScore.display;
      }
      if (sport === 'cricket') {
        const { currentBattingTeamId: battingId } = boilerData;
        if (battingId === homeTeamId) {
          event.homeTeam.isBatting = true;
        }
        if (battingId === awayTeamId) {
          event.awayTeam.isBatting = true;
        }
        const { displayHomeScore, displayAwayScore } = refineInnings(
          homeScore,
          awayScore
        );
        event.homeScore = displayHomeScore;
        event.awayScore = displayAwayScore;
        event.note = matchStatus === 'Ended' ? boilerData.note : matchStatus;
        //In case there was no note of ended match
        if (!event.note) {
          event.note = 'Note is being updated.....';
        }
      }
    } else if (sport === 'cricket') {
      if (matchStatus === 'Not Started') {
        event.note = 'Not Started Yet';
      }
      if (matchStatus === 'Abandoned') {
        event.note = 'Match abandoned without a ball bowled';
      }
    }
    // Avoiding unnecessary work if competitionId already exists.
    if (acc[slug]) {
      acc[slug].events.push(event);
      return acc;
    }
    let competitionImage;
    // International for basketball and world for cricket.
    if (
      category.slug === 'international' ||
      competitionName === 'NBA' ||
      category.slug === 'world'
    ) {
      competitionImage = `https://api.sofascore.app/api/v1/unique-tournament/${uniqueId}/image`;
    } else {
      // Case where there is no alpha2,majorly in cricket.
      imageCode = category.alpha2
        ? category.alpha2.toLowerCase()
        : category.flag;
      competitionImage = `https://www.sofascore.com/static/images/flags/${imageCode}.png`;
    }
    if (!acc[slug]) {
      acc[slug] = {
        competitionName,
        competitionId: sport === 'cricket' ? tournamentId : uniqueId,
        uniqueId,
        competitionImage,
        venue: category.name,
        events: [event],
      };
      return acc;
    }
  }, {});
  // We created a object with property name as slug while transformation but what we need is actually values of the object.
  const refinedData = Object.values(reducedData);
  const todaysRandomNo = !live && +date.split('-').at(2).at(-1) % 5;
  const featuredMatch =
    !live && getFeaturedMatches(refinedData, sport, todaysRandomNo);
  if (live) {
    return { matches: refinedData };
  }
  return { matches: refinedData, featuredMatch };
};
const getFootballMatches = async (date, timeZoneDiff, live = false) => {
  // To transform the timeZone given from the user
  const [dirtyTimeZoneHour, timeZoneMinute] = !live
    ? timeZoneDiff.split(':')
    : [];
  const timeZoneHour =
    !live && +timeZoneMinute > 30
      ? Number(dirtyTimeZoneHour) + 1
      : dirtyTimeZoneHour;
  const URL = `https://livescore-sports.p.rapidapi.com/v1/events/${
    live ? 'live?' : `list?date=${date}&`
  }locale=EN&${live ? 'timezone=0' : `timezone=${timeZoneHour}`}&sport=soccer`;
  const res = await fetch(URL, footballApiOptions);
  if (res.status === 404) {
    handleError('football matches');
  }
  const { DATA: data } = await res.json();
  let minimizedSet;
  if (data?.length === 0) {
    return [];
  }
  if (data.length <= 10) {
    minimizedSet = data
      .slice(0, 10)
      .filter((comp) => comp.COMPETITION_ID !== undefined);
  } else {
    minimizedSet = data.slice(0, 15).filter((comp) => {
      if (
        !(
          comp.STAGE_NAME === 'League 1' ||
          comp.STAGE_NAME === 'League 2' ||
          comp.STAGE_NAME === 'National League' ||
          comp.COMPETITION_ID === undefined
        )
      ) {
        return comp;
      }
    });
  }
  const refinedSet = minimizedSet.map((set) => {
    const events = set.EVENTS.map((unfilteredEvent) => {
      const {
        MATCH_ID: matchId,
        HOME_TEAM: homeTeam,
        AWAY_TEAM: awayTeam,
        MATCH_START_DATE: dirtyStartTime,
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
        startTime: live
          ? dirtyStartTime
          : refineFootballDate(dirtyStartTime, timeZoneDiff),
        matchStatus,
      };
      if (matchStatus !== 'NS') {
        event.homeScore = homeScore;
        event.awayScore = awayScore;
      }
      if (matchStatus === 'FT') {
        event.winnerTeam = winnerTeam;
      }
      return event;
    });
    const {
      STAGE_NAME: competitionName,
      COMPETITION_ID: competitionId,
      COUNTRY_NAME: venue,
      STAGE_CODE: stageCode,
    } = set;
    return {
      competitionName,
      competitionId,
      venue,
      events,
      competitionImage: `https://static.livescore.com/i2/fh/${stageCode}.jpg`,
    };
  });
  // Random no. is gotten by first splitting date and taking out second's position which gives us day and we take last value of the day,if it is 26 it gives 6 and we convert it to number and mod by 5.
  // it is constant for one day.
  const todaysRandomNo = !live && +date.split('-').at(2).at(-1) % 5;
  const featuredMatch =
    !live && getFeaturedMatches(refinedSet, 'football', todaysRandomNo);
  if (live) {
    return { matches: refinedSet };
  }
  return { matches: refinedSet, featuredMatch };
};
module.exports = { getMatches, getFootballMatches };
