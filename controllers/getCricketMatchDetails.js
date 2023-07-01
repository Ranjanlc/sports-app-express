const { refineStandings } = require('../util/competition-helper');
const {
  sportApiOptions,
  refineInnings,
  handleError,
} = require('../util/transform-data');
const { fetchData, getMatchDate } = require('../util/api-helper');

exports.getCricketInfo = async (matchId) => {
  const url = `https://sofasport.p.rapidapi.com/v1/events/data?event_id=${matchId}`;
  const data = await fetchData(url, 'matchInfo');
  const {
    venue: dirtyVenue,
    homeScore,
    awayScore,
    startTimestamp,
    tossWin,
    tossDecision,
    umpire1Name,
    umpire2Name,
  } = data;
  const {
    city: { name: cityName },
    stadium: { name: stadiumName },
  } = dirtyVenue;
  const venue = `${stadiumName},${cityName}`;
  const umpires =
    umpire1Name && `${umpire1Name} ${umpire2Name ? `and ${umpire2Name}` : ''}`;
  const toss =
    tossWin &&
    `${tossWin} won the toss and decided to ${tossDecision
      //   Batting=>bat,Bowling=>bowl
      .toLowerCase()
      .replace('ing', '')
      .replace('t', '')} first`;
  const { home, away } = refineInnings(homeScore, awayScore, false);
  return {
    venue,
    homeScore: home,
    awayScore: away,
    toss,
    umpires,
    startDate: getMatchDate(startTimestamp),
  };
};

exports.getCricketInnings = async (matchId) => {
  const url = `https://sofasport.p.rapidapi.com/v1/events/innings?event_id=${matchId}`;
  const data = await fetchData(url, 'cricket innings');
  const refinedInnings = data.map((inning) => {
    const {
      extra: extraRuns,
      wide,
      noBall,
      bye,
      legBye,
      penalty,
      battingTeam: { name: battingTeam },
      bowlingTeam: { name: bowlingTeam },
      bowlingLine,
      battingLine,
      currentBatsman,
      currentBowler,
    } = inning;
    // 0 would automatically filter out
    const extraContainer = [
      `${wide} Wd`,
      `${noBall} Nb`,
      `${bye} B`,
      `${legBye} Lb`,
      `${penalty} P`,
    ].filter((el) => parseInt(el));
    const extras = `Extras: ${extraRuns} (${extraContainer.join(',')})`;
    const bowlers = bowlingLine.map((bowlerSet) => {
      const {
        player: { id },
        playerName: name,
        over,
        maiden,
        run,
        wicket,
      } = bowlerSet;
      const economy = (run / over).toFixed(2) || '-';
      return { player: { id, name }, over, maiden, run, wicket, economy };
    });
    const diryFowArr = [];
    const batsmen = battingLine.map((batsman) => {
      const {
        player: { id },
        playerName: name,
        score,
        balls,
        s4: fours,
        s6: sixes,
        wicketBowlerName: bowler,
        wicketTypeName: type,
        wicketCatchName: catcher,
        fowScore,
        fowOver,
      } = batsman;
      fowScore &&
        fowOver &&
        diryFowArr.push({ fowScore, fowOver, playerName: name });
      return {
        player: { id, name },
        score,
        balls,
        fours,
        sixes,
        wicket: {
          type,
          catcher,
          bowler,
        },
      };
    });
    const sortedFowArr = diryFowArr.sort((a, b) => a.fowOver - b.fowOver);
    const finalFowArr = sortedFowArr.map(
      ({ fowOver, fowScore, playerName }, i) => {
        return `${fowScore}/${i + 1} (${playerName}, ${fowOver})`;
      }
    );
    return {
      extras,
      battingTeam,
      bowlingTeam,
      bowlers,
      batsmen,
      fallOfWickets: finalFowArr,
      currentBatsmanId: currentBatsman?.id,
      currentBowlerId: currentBowler?.id,
    };
  });
  return refinedInnings;
};

exports.getCompetitionTable = async (id, uniqueId, sport = 'cricket') => {
  const url = `https://sofasport.p.rapidapi.com/v1/${
    sport === 'cricket' ? 'tournaments' : 'unique-tournaments'
  }/seasons?${sport === 'cricket' ? 'tournament_id' : 'unique_tournament_id'}=${
    sport === 'cricket' ? id : uniqueId
  }`;
  let standingSet;
  const seasonData = await fetchData(url, 'standings');
  const seasons = sport === 'basketball' ? seasonData : seasonData.seasons;
  const seasonId = seasons.at(0).id;
  const standingUrl = `https://sofasport.p.rapidapi.com/v1/seasons/standings?standing_type=total&seasons_id=${seasonId}&unique_tournament_id=${uniqueId}`;
  const standingData = await fetchData(standingUrl, 'standings');
  if (standingData) {
    if (standingData.length === 1) {
      standingSet = { standings: refineStandings(standingData[0], sport) };
    }
    if (standingData.length >= 1) {
      standingSet = standingData.map((compData) => {
        return {
          groupName: compData.name,
          standings: refineStandings(compData, sport),
        };
      });
    }
  }
  return standingSet;
};
