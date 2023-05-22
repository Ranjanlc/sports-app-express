const {
  getMatchDate,
  refineInnings,
  footballApiOptions,
  sportApiOptions,
  refineFootballDate,
  topClubs,
} = require('../util/transform-data');
const checkFeatured = (eventSet, sport, randomNo, slug) => {
  const events = eventSet.filter((event) => {
    const {
      homeTeam: { name: homeTeamName },
      awayTeam: { name: awayTeamName },
    } = event;
    // The sport and slug gives dynamic value of a sport and league slug to access in topClubs object
    const includesTopClub =
      topClubs[sport][slug].includes(homeTeamName) ||
      topClubs[sport][slug].includes(awayTeamName);
    if (includesTopClub) return event;
  });
  if (randomNo > events?.length - 1) {
    randomNo = events?.length - 1;
  }
  // const featuredEvent =  || [];
  //If array is empty,at method will give us undefined.
  return events.at(randomNo);
};

const getFeaturedMatches = (competitionSet, sport, randomNo) => {
  const featuredEvent = competitionSet.reduce((acc, comp) => {
    // We dont push anymore if we already have one featured event
    if (acc.length !== 0) return acc;
    const { events: eventSet, competitionName } = comp;
    if (sport === 'football') {
      switch (competitionName) {
        case 'Premier League':
          const premierEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'pl'
          );
          premierEvent && acc.push(premierEvent);
          //  acc.push(premierEvent);
          break;
        case 'LaLiga Santander':
          const ligaEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'laLiga'
          );
          ligaEvent && acc.push(ligaEvent);
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push(serieEvent);
          break;
        case 'Ligue 1':
          const ligueEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'ligue1'
          );
          ligueEvent && acc.push(ligueEvent);
          break;
        case 'Bundesliga':
          const bundesEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'bundesliga'
          );
          bundesEvent && acc.push(bundesEvent);
          break;
        default:
          // acc.push('OTHERR');
          break;
      }
    }
    if (sport === 'basketball') {
      switch (competitionName) {
        case 'NBA':
          const nbaEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'nba'
          );
          nbaEvent && acc.push(nbaEvent);
          break;
        case 'LNB':
          const ligaEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'lnb'
          );
          ligaEvent && acc.push(ligaEvent);
          break;
        case 'A1':
          const a1Event = checkFeatured(eventSet, 'basketball', randomNo, 'a1');
          a1Event && acc.push(a1Event);
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push(serieEvent);
          break;
        case 'Liga ACB':
          const ligaACBEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'ligaACB'
          );
          ligaACBEvent && acc.push(ligaACBEvent);
          break;
        default:
          break;
      }
    }
    if (sport === 'cricket') {
      switch (competitionName) {
        case 'Indian Premier League':
          const iplEvent = checkFeatured(eventSet, 'cricket', randomNo, 'ipl');
          iplEvent && acc.push(iplEvent);
          break;
        case 'Pakistan Super League':
          const pslEvent = checkFeatured(eventSet, 'cricket', randomNo, 'psl');
          pslEvent && acc.push(pslEvent);
          break;
        case 'Big Bash League':
          const bashEvent = checkFeatured(eventSet, 'cricket', randomNo, 'bbl');
          bashEvent && acc.push(bashEvent);
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'cricket',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push(serieEvent);
          break;
        default:
          break;
      }
    }
    return acc;
  }, []);
  // console.log(featuredEvent);
  if (featuredEvent?.length === 0) {
    // console.log('chiryoo');
    const { events } = competitionSet[0];
    if (randomNo > events?.length - 1) {
      // console.log('entereeedd');
      randomNo = events?.length - 1;
    }
    return events[randomNo];
  }
  return featuredEvent.at(0);
};

const getMatches = async (date, sport, live = false) => {
  // Sport id of basketball is 2 and cricket is 62.
  // console.log(date);
  const res = await fetch(
    `https://sofasport.p.rapidapi.com/v1/events/schedule/${
      live ? 'live?' : `date?date=${date}&`
    }sport_id=${sport === 'basketball' ? '2' : '62'}`,
    sportApiOptions
  );
  if (res.status === 404) {
    const error = new Error("Can't fetch cricket/basketball matches");
    error.code = 404;
    throw error;
  }
  // console.log(await res.json());
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
  // console.log(URL);
  const res = await fetch(URL, footballApiOptions);
  if (res.status === 404) {
    const error = new Error("Can't fetch football matches");
    error.code = 404;
    throw error;
  }
  const { DATA: data } = await res.json();
  // console.log(data);
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
    // TODO:Use destructuring syntax to make it easy.
    // console.log(set.EVENTS);
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
      // console.log(homeTeam.at(0), awayTeam.at(0));
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
  // console.log(refinedSet);
  const todaysRandomNo = !live && +date.split('-').at(2).at(-1) % 5;
  const featuredMatch =
    !live && getFeaturedMatches(refinedSet, 'football', todaysRandomNo);
  // console.log(featuredMatch);
  if (live) {
    return { matches: refinedSet };
  }
  return { matches: refinedSet, featuredMatch };
};
module.exports = { getMatches, getFootballMatches };
