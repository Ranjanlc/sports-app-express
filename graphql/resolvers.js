// const fetch = require('node-fetch');
module.exports = {
  getFootballMatches: async (date) => {
    const res = await fetch(
      `https://livescore-sports.p.rapidapi.com/v1/events/list?date=2023-02-11&locale=EN&timezone=0&sport=soccer`,
      {
        headers: {
          'X-RapidAPI-Key':
            'ef2b7f80a7msh604fd81c4dafed9p1dbbb1jsn456d6190b926',
          'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
        },
      }
    );
    const { DATA: data } = await res.json();
    let minimizedSet;
    if (data.length <= 10) {
      minimizedSet = data;
    } else {
      minimizedSet = data.slice(0, 15).filter((comp) => {
        if (
          !(
            comp.STAGE_NAME === 'League 1' ||
            comp.STAGE_NAME === 'League 2' ||
            comp.STAGE_NAME === 'National League'
          )
        ) {
          return comp;
        }
      });
    }
    const refinedSet = minimizedSet.map((set) => {
      const events = set.EVENTS.map((event) => {
        const notStarted = {
          matchId: event.MATCH_ID,
          homeTeam: {
            name: event.HOME_TEAM.at(0).NAME,
            imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
              event.HOME_TEAM.at(0).BADGE_ID
            }.png`,
          },
          awayTeam: {
            name: event.AWAY_TEAM.at(0).NAME,
            imageUrl: `https://lsm-static-prod.livescore.com/high/enet/${
              event.AWAY_TEAM.at(0).BADGE_ID
            }.png`,
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
        competitionName: set.COMPETITION_NAME,
        competitionId: set.COMPETITION_ID,
        venue: set.COUNTRY_NAME,
        events,
        competitionImage: `https://static.livescore.com/i2/fh/${set.STAGE_CODE}.jpg`,
      };
    });
    console.log(refinedSet);
    return refinedSet;
  },
};
