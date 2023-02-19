// const fetch = require('node-fetch');
const getMatchDate = (timeStamp) => {
  const dateObj = new Date(+timeStamp * 1000);
  const year = dateObj.getFullYear();
  const month = dateObj.getUTCMonth() + 1; // add 1 since month is zero-based
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getUTCSeconds();
  // Format the date and time as a string
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  return formattedTime;
};
const checkWickets = (wickets) => {
  return `${wickets === 10 ? '' : `/${wickets}`}`;
};
const getMatches = async (date, sport, live = false) => {
  const res = await fetch(
    `https://sofasport.p.rapidapi.com/v1/events/schedule/${
      live ? 'live?' : `date?date=${date}&`
    }sport_id=${sport === 'basketball' ? '2' : '62'}`,
    {
      headers: {
        'X-RapidAPI-Key': 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
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
        id: competitionId,
        name: competitionName,
        slug,
        category,
        uniqueTournament,
      },
      id: matchId,
      status,
      homeTeam: { name: homeTeamName, id: homeTeamId },
      awayTeam: { name: awayTeamName, id: awayTeamId },
      homeScore, //complexity coz of API's name.
      awayScore,
      winnerCode: winnerTeam,
      startTimestamp,
    } = boilerData;
    const event = {
      matchId,
      matchStatus: status.description,
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
        status.description === 'Not started' ||
        status.description === 'Abandoned'
      )
    ) {
      // event.startTime = status.description;
      if (status.description === 'Ended') event.winnerTeam = winnerTeam;
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
        const { display: homeDisplay, innings: homeInnings } = homeScore;
        const { display: awayDisplay, innings: awayInnings } = awayScore;
        const homeInningsRefined = homeInnings
          ? homeInnings
          : {
              inning1: {
                score: 'Yet to bat',
                wickets: 0,
                overs: '-',
              },
            };
        const awayInningsRefined = awayInnings
          ? awayInnings
          : {
              inning1: {
                score: 'Yet to bat',
              },
            };
        const {
          inning1: {
            score: home1stScore,
            wickets: home1stWickets,
            overs: home1stOvers,
          },
          inning2: homeInning2,
        } = homeInningsRefined;
        const {
          inning1: {
            score: away1stScore,
            wickets: away1stWickets,
            overs: away1stOvers,
          },
          inning2: awayInning2,
        } = awayInningsRefined;
        if (homeInning2 || awayInning2) {
          const awayTotalScore = awayDisplay;
          const homeTotalScore = homeDisplay;
          let dirtyHomeScore;
          if (homeInning2) {
            dirtyHomeScore = `${homeInning2.score}${checkWickets(
              homeInning2.wickets
            )} (${homeInning2.overs})`;
          } else {
            dirtyHomeScore = `${home1stScore}${checkWickets(
              home1stWickets
            )} (${home1stOvers})`;
          }
          let dirtyAwayScore;
          if (awayInning2) {
            dirtyAwayScore = `${awayInning2.score}${checkWickets(
              awayInning2.wickets
            )} (${awayInning2.overs})`;
          } else {
            dirtyAwayScore = `${away1stScore}${checkWickets(
              away1stWickets
            )} (${away1stOvers})`;
          }
          event.homeScore = `${dirtyHomeScore} ${homeTotalScore}`;
          event.awayScore = `${dirtyAwayScore} ${awayTotalScore}`;
        } else {
          //To check if there is innings object in homeScore,where the match might be played and it's innings may not come;
          event.homeScore = homeScore.innings
            ? `${home1stScore}${checkWickets(home1stWickets)} (${home1stOvers})`
            : 'Yet to bat';
          event.awayScore = awayScore.innings
            ? `${away1stScore}${checkWickets(away1stWickets)} (${away1stOvers})`
            : 'Yet to bat';
        }
        event.note =
          status.description === 'Ended' ? boilerData.note : status.description;
        //In case there was no note of ended match
        if (!event.note) {
          event.note = 'Note is being updated.....';
        }
      }
    } else if (sport === 'cricket') {
      if (status.description === 'Not Started') {
        event.note = 'Not Started Yet';
      }
      if (status.description === 'Abandoned') {
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
      // From unique tourna's id is where we get the image.
      const { id } = uniqueTournament;
      competitionImage = `https://api.sofascore.app/api/v1/unique-tournament/${id}/image`;
    } else {
      imageCode = category.alpha2.toLowerCase();
      competitionImage = `https://www.sofascore.com/static/images/flags/${imageCode}.png`;
    }
    if (!acc[slug]) {
      acc[slug] = {
        competitionName,
        competitionId,
        competitionImage,
        venue: category.name,
        events: [event],
      };
      return acc;
    }
  }, {});
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
      'X-RapidAPI-Key': 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
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
const destructureStandings = (data, setGroup = false) => {
  const {
    LEAGUE_TABLE: { L },
  } = data;
  const { TABLES: table } = L[0];
  const { TEAM: teams } = table[0];
  const standings = teams.map((team) => {
    const {
      TEAM_ID: teamId,
      RANK: position,
      TEAM_NAME: name,
      TEAM_PLAYED: played,
      WINS_INT: wins,
      DRAWS_INT: draws,
      LOSES_INT: loses,
      GOAL_FOR: GF,
      GOAL_AGAINST: GA,
      GOAL_DIFFERENCE: GD,
      POINTS_INT: points,
    } = team;
    countryCode = setGroup && data.COUNTRY_CODE;
    return {
      [setGroup && 'group']: countryCode,
      teamId,
      position,
      name,
      played,
      wins,
      draws,
      loses,
      GF,
      GA,
      GD,
      points,
    };
  });
  return standings;
};
exports.getCompetitionDetails = async ({ compId }) => {
  const res = await fetch(
    `https://livescore-sports.p.rapidapi.com/v1/competitions/details?timezone=0&competition_id=60&locale=EN`,
    {
      headers: {
        'X-RapidAPI-Key': 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
        'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
      },
    }
  );
  const res1 = await fetch(
    `https://livescore-sports.p.rapidapi.com/v1/competitions/standings?timezone=0&competition_id=60&locale=EN`,
    {
      headers: {
        'X-RapidAPI-Key': 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
        'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
      },
    }
  );
  const {
    DATA: { STAGES },
  } = await res.json();
  const { DATA: data } = await res1.json();
  let standings;
  if (data.length === 0) standings = [];
  if (data.length > 1) {
    standings = data.flatMap((item) => {
      return destructureStandings(item, true);
    });
    console.log(standings);
  }
  if (data.length === 1) {
    standings = destructureStandings(data[0]);
  }

  const { EVENTS: events } = STAGES.at(0);
  const matches = { fixtures: [], results: [] };
  events.forEach((unfilteredEvent) => {
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
      matches.results.unshift(event);
    } else {
      matches.fixtures.push(event);
    }
  });

  return { matches, standings };
};
