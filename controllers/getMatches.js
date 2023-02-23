const {
  getMatchDate,
  refineInnings,
  API_KEY,
} = require('../helpers/transform-data');

const getMatches = async (date, sport, live = false) => {
  // Sport id of basketball is 2 and cricket is 62.
  const res = await fetch(
    `https://sofasport.p.rapidapi.com/v1/events/schedule/${
      live ? 'live?' : `date?date=${date}&`
    }sport_id=${sport === 'basketball' ? '2' : '62'}`,
    {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
      },
    }
  );
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
      },
      awayTeam: {
        name: awayTeamName,
        imageUrl: `https://api.sofascore.app/api/v1/team/${awayTeamId}/image`,
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
        event.homeScore = String(homeScore.display);
        event.awayScore = String(awayScore.display);
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
  // console.log(refinedData);
  return refinedData;
};

const getFootballMatches = async (date, live = false) => {
  const URL = `https://livescore-sports.p.rapidapi.com/v1/events/${
    live ? 'live?' : `list?date=${date}&`
  }locale=EN&timezone=0&sport=soccer`;
  // console.log(URL);
  const res = await fetch(URL, {
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
    },
  });
  const { DATA: data } = await res.json();
  // console.log(data);
  let minimizedSet;
  if (data?.length === 0) {
    return [];
  }
  if (data.length <= 10) {
    minimizedSet = data
      .slice(0, 10)
      .filter((comp) => comp.competitionId !== undefined);
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
    // TODO:Use destructuring syntax to make it easy.
    const events = set.EVENTS.map((unfilteredEvent) => {
      const {
        MATCH_ID: matchId,
        HOME_TEAM: homeTeam,
        AWAY_TEAM: awayTeam,
        MATCH_START_DATE: startTime,
        MATCH_STATUS: matchStatus,
        HOME_SCORE: homeScore,
        AWAY_SCORE: awayScore,
      } = unfilteredEvent;
      const event = {
        matchId,
        homeTeam: {
          name: homeTeam.at(0).NAME,
          imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
            homeTeam.at(0).BADGE_ID
          }.png`,
        },
        awayTeam: {
          name: awayTeam.at(0).NAME,
          imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
            awayTeam.at(0).BADGE_ID
          }.png`,
        },
        startTime,
        matchStatus,
      };
      if (matchStatus !== 'NS') {
        event.homeScore = homeScore;
        event.awayScore = awayScore;
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
  console.log(refinedSet);
  return refinedSet;
};
module.exports = { getMatches, getFootballMatches };
