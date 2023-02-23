const {
  getFootballStandings,
  refineStandings,
  refineInnings,
  API_KEY,
  getMatchDate,
} = require('../helpers/transform-data');
const getFootballURL = (compId, mode) => {
  return `https://livescore-sports.p.rapidapi.com/v1/competitions/${mode}?timezone=0&competition_id=${compId}&locale=EN`;
};
const options = {
  headers: {
    'X-RapidAPI-Key': API_KEY,
    'X-RapidAPI-Host': 'livescore-sports.p.rapidapi.com',
  },
};
const getFootballCompDetails = async (compId) => {
  const res = await fetch(getFootballURL(compId, 'details'), options);
  const res1 = await fetch(getFootballURL(compId, 'standings'), options);
  const {
    DATA: { STAGES },
  } = await res.json();
  const { DATA: standingData } = await res1.json();
  let standings;
  if (standingData.length === 0) standings = [];
  if (standingData.length > 1) {
    // flatMap coz there would be two arrays,one from the map itself and from destructureStandings and as it doesnt fit schema,we flatMap.
    standings = standingData.flatMap((item) => {
      return getFootballStandings(item, true);
    });
  }
  if (data.length === 1) {
    standings = getFootballStandings(data[0]);
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

const getCompetitionDetails = async (
  sport,
  id,
  appSeasonId,
  dateState,
  page,
  uniqueId
) => {
  // All this uniqueId and id stuff just to load cricket data with tournament id and as matches needs uniquetournament,we pass it extra too.But with basketball,we fetch it with uniqueId which is simply under id.
  console.log(id, uniqueId);
  let seasonId, standingSet;
  if (appSeasonId) {
    seasonId = appSeasonId;
  } else {
    console.log('chirenaa');
    const res = await fetch(
      `https://sofasport.p.rapidapi.com/v1/${
        sport === 'cricket' ? 'tournaments' : 'unique-tournaments'
      }/seasons?${
        sport === 'cricket' ? 'tournament_id' : 'unique_tournament_id'
      }=${id}`,
      {
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
        },
      }
    );
    const { data } = await res.json();
    const seasons = sport === 'basketball' ? data : data.seasons;
    seasonId = seasons.at(0).id;
  }
  const standingRes = await fetch(
    `https://sofasport.p.rapidapi.com/v1/seasons/standings?standing_type=total&seasons_id=${seasonId}&${
      sport === 'cricket' ? 'tournament_id' : 'unique_tournament_id'
    }=${id}`,
    {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
      },
    }
  );
  const { data: standingData } = await standingRes.json();
  console.log(standingData);
  const matchRes = await fetch(
    `https://sofasport.p.rapidapi.com/v1/seasons/events?course_events=${dateState}&page=${page}&seasons_id=${seasonId}&unique_tournament_id=${
      sport === 'cricket' ? uniqueId : id
    }`,
    {
      headers: {
        'X-RapidAPI-Key': API_KEY,
        'X-RapidAPI-Host': 'sofasport.p.rapidapi.com',
      },
    }
  );
  const {
    data: { events, hasNextPage },
  } = await matchRes.json();
  const matches = [];
  events.forEach((boilerData) => {
    const {
      id: matchId,
      status: { description: matchStatus },
      homeTeam: { name: homeTeamName, id: homeTeamId },
      awayTeam: { name: awayTeamName, id: awayTeamId },
      homeScore, //complexity coz of API's name.
      awayScore,
      winnerCode: winnerTeam,
      startTimestamp,
      note,
    } = boilerData;
    const event = {
      matchId,
      matchStatus,
      homeTeam: {
        name: homeTeamName,
        imageUrl: `https://api.sofascore.app/api/v1/team/${homeTeamId}/image`,
      },
      awayTeam: {
        name: awayTeamName,
        imageUrl: `https://api.sofascore.app/api/v1/team/${awayTeamId}/image`,
      },
      startTime: getMatchDate(startTimestamp),
      // will note set if it is basketball
      [sport === 'cricket' && 'note']:
        matchStatus === 'Ended' ? note : matchStatus,
    };
    if (dateState === 'last') {
      event.winnerTeam = winnerTeam;
      if (sport === 'basketball') {
        event.homeScore = homeScore;
        event.awayScore = awayScore;
      }
      if (sport === 'cricket') {
        const { displayHomeScore, displayAwayScore } = refineInnings(
          homeScore,
          awayScore
        );
        event.homeScore = displayHomeScore;
        event.awayScore = displayAwayScore;
        //Overwriting default matchStatus notes with below.
        if (matchStatus === 'Not Started') {
          event.note = 'Not Started Yet';
        }
        if (matchStatus === 'Abandoned') {
          event.note = 'Match abandoned without a ball bowled';
        }
        if (matchStatus === 'Interrupted') {
          event.note = 'Match was interrupted.';
        }
      }
      matches.unshift(event);
    }
    if (dateState === 'next') {
      // TODO:If running matches are on this set,do necessary things to fine-tune it.
      matches.push(event);
    }
  });
  if (standingData?.length === 1) {
    standingSet = { standings: refineStandings(standingData[0], sport) };
  }
  if (standingData?.length >= 1) {
    standingSet = standingData.map((compData) => {
      return {
        groupName: compData.name,
        standings: refineStandings(compData, sport),
      };
    });
  }
  console.log(standingSet);
  return { matchSet: { matches, hasNextPage, seasonId }, standingSet };
};

module.exports = { getFootballCompDetails, getCompetitionDetails };
