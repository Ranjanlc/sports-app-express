// const fetch = require('node-fetch');
const getMatchDate = (timeStamp) => {
  // console.log(timeStamp);
  const dateObj = new Date(+timeStamp * 1000);
  // console.log(dateObj);
  const year = dateObj.getFullYear();
  const month = dateObj.getUTCMonth() + 1; // add 1 since month is zero-based
  const day = dateObj.getUTCDate();
  const hours = dateObj.getUTCHours();
  const minutes = dateObj.getUTCMinutes();
  const seconds = dateObj.getUTCSeconds();

  // Format the date and time as a string
  const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  // Output the formatted time
  return formattedTime;
};
const getMatches = async (date, sport) => {
  const res = await fetch(
    `https://livescore-sports.p.rapidapi.com/v1/events/list?date=${date}&locale=EN&timezone=0&sport=${sport}`,
    {
      headers: {
        'X-RapidAPI-Key': 'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
        'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
      },
    }
  );
  const { DATA: data } = await res.json();
  let minimizedSet;
  if (sport === 'basketball') {
    minimizedSet = data.slice(0, 10);
  }
  if (sport === 'soccer') {
    if (data.length <= 10) {
      minimizedSet = data;
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
  }
  const refinedSet = minimizedSet.map((set) => {
    // TODO:Use destructuring syntax to make it easy.
    const events = set.EVENTS.map((event) => {
      const notStarted = {
        matchId: event.MATCH_ID,
        homeTeam: {
          name: event.HOME_TEAM.at(0).NAME,
          imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
            event.HOME_TEAM.at(0).BADGE_ID
          }.png`,
          teamId: event.HOME_TEAM.at(0).ID,
        },
        awayTeam: {
          name: event.AWAY_TEAM.at(0).NAME,
          imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
            event.AWAY_TEAM.at(0).BADGE_ID
          }.png`,
          teamId: event.AWAY_TEAM.at(0).ID,
        },
        startTime: event.MATCH_START_DATE,
        matchStatus: event.MATCH_STATUS,
      };
      if (event.MATCH_STATUS !== 'NS') {
        return {
          ...notStarted,
          homeScore: event.HOME_SCORE,
          awayScore: event.AWAY_SCORE,
        };
      } else {
        return notStarted;
      }
    });

    return {
      competitionName: set.STAGE_NAME,
      competitionId: set.COMPETITION_ID,
      venue: set.COUNTRY_NAME,
      events,
      competitionImage: `https://static.livescore.com/i2/fh${
        sport === 'basketball' ? '/xbb-' : '/'
      }${set.STAGE_CODE}.jpg`,
    };
  });
  // console.log(refinedSet);
  return refinedSet;
};
module.exports = {
  getFootballMatches: ({ date }) => {
    // For API ReASONS
    return getMatches(date, 'soccer');
  },
  getBasketballMatches: async ({ date }) => {
    // return getMatches(date, 'basketball');
    const res = await fetch(
      `https://sofasport.p.rapidapi.com/v1/events/schedule/date?date=${date}&sport_id=2`,
      {
        headers: {
          'X-RapidAPI-Key':
            'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
          'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
        },
      }
    );
    const { data } = await res.json();
    const reducedData = data.slice(0, 100).reduce((acc, boilerData) => {
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
        homeTeam: { id: homeTeamId, name: homeTeamName },
        awayTeam: { id: awayTeamId, name: awayTeamName },
        homeScore: { display: homeScore }, //complexity coz of API's name.
        awayScore: { display: awayScore },
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
        winnerTeam,
        startTime: getMatchDate(startTimestamp),
      };
      if (status.description !== 'Not Started') {
        event.homeScore = homeScore;
        event.awayScore = awayScore;
      }
      // Avoiding unnecessary work if competitionId already exists.
      if (acc[slug]) {
        acc[slug].events.push(event);
        return acc;
      }
      let competitionImage;
      if (category.slug === 'international' || competitionName === 'NBA') {
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
    // console.log(Object.values(reducedData).at(0).events);
    const refinedData = Object.values(reducedData);
    return refinedData;
  },
};
