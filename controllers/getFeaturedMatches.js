const { TOP_CLUBS } = require('../util/transform-data');
const checkFeatured = (eventSet, sport, randomNo, slug) => {
  const events = eventSet.filter((event) => {
    const {
      homeTeam: { name: homeTeamName },
      awayTeam: { name: awayTeamName },
    } = event;
    // The sport and slug gives dynamic value of a sport and league slug to access in topClubs object
    const includesTopClub =
      TOP_CLUBS[sport][slug].includes(homeTeamName) ||
      TOP_CLUBS[sport][slug].includes(awayTeamName);
    if (includesTopClub) return event;
  });
  if (randomNo > events?.length - 1) {
    randomNo = events?.length - 1;
  }
  // const featuredEvent =  || [];
  //If array is empty,at method will give us undefined.
  return events.at(randomNo);
};

exports.getFeaturedMatches = (competitionSet, sport, randomNo) => {
  const featuredEvent = competitionSet.reduce((acc, comp) => {
    // We dont push anymore if we already have one featured event
    if (acc.length !== 0) return acc;
    const { events: eventSet, competitionName, competitionId } = comp;
    const compSet = { competitionId, competitionName };
    if (sport === 'football') {
      switch (competitionName) {
        case 'Premier League':
          const premierEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'pl'
          );
          premierEvent &&
            acc.push({
              ...compSet,
              event: premierEvent,
            });
          //  acc.push(premierEvent);
          break;
        case 'LaLiga Santander':
          const ligaEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'laLiga'
          );
          ligaEvent && acc.push({ event: ligaEvent, ...compSet });
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push({ event: serieEvent, ...compSet });
          break;
        case 'Ligue 1':
          const ligueEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'ligue1'
          );
          ligueEvent && acc.push({ event: ligueEvent, ...compSet });
          break;
        case 'Bundesliga':
          const bundesEvent = checkFeatured(
            eventSet,
            'football',
            randomNo,
            'bundesliga'
          );
          bundesEvent && acc.push({ event: bundesEvent, ...compSet });
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
          nbaEvent && acc.push({ event: nbaEvent, ...compSet });
          break;
        case 'LNB':
          const ligaEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'lnb'
          );
          ligaEvent && acc.push({ event: ligaEvent, ...compSet });
          break;
        case 'A1':
          const a1Event = checkFeatured(eventSet, 'basketball', randomNo, 'a1');
          a1Event && acc.push({ event: a1Event, ...compSet });
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push({ event: serieEvent, ...compSet });
          break;
        case 'Liga ACB':
          const ligaACBEvent = checkFeatured(
            eventSet,
            'basketball',
            randomNo,
            'ligaACB'
          );
          ligaACBEvent && acc.push({ event: ligaACBEvent, ...compSet });
          break;
        default:
          break;
      }
    }
    if (sport === 'cricket') {
      switch (competitionName) {
        case 'Indian Premier League':
          const iplEvent = checkFeatured(eventSet, 'cricket', randomNo, 'ipl');
          iplEvent && acc.push({ event: iplEvent, ...compSet });
          break;
        case 'Pakistan Super League':
          const pslEvent = checkFeatured(eventSet, 'cricket', randomNo, 'psl');
          pslEvent && acc.push({ event: pslEvent, ...compSet });
          break;
        case 'Big Bash League':
          const bashEvent = checkFeatured(eventSet, 'cricket', randomNo, 'bbl');
          bashEvent && acc.push({ event: bashEvent, ...compSet });
          break;
        case 'Serie A':
          const serieEvent = checkFeatured(
            eventSet,
            'cricket',
            randomNo,
            'serieA'
          );
          serieEvent && acc.push({ event: serieEvent, ...compSet });
          break;
        default:
          break;
      }
    }
    return acc;
  }, []);
  if (featuredEvent?.length === 0) {
    const { events, competitionName, competitionId } = competitionSet[0];
    if (randomNo > events?.length - 1) {
      randomNo = events?.length - 1;
    }
    return { event: events[randomNo], competitionName, competitionId };
  }
  return featuredEvent.at(0);
};
