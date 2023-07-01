const {
  footballApiOptions,
  sportApiOptions,
  handleError,
} = require('./transform-data');

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
const checkCurrentDayMatch = (timeStamp, curDate, timeZoneDiff) => {
  const sign = timeZoneDiff.at(0);
  const [hours, minutes] = timeZoneDiff.slice(1).split(':');

  const numHours = +hours;
  const numMinutes = +minutes;
  const refinedTimeStamp =
    sign === '+'
      ? timeStamp + (numHours * 60 * 60 + numMinutes * 60)
      : timeStamp - (numHours * 60 * 60 + numMinutes * 60);
  const [refinedMatchDate, _] = getMatchDate(refinedTimeStamp).split(' ');
  const [month, day, year] = new Date(refinedMatchDate)
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/');
  // Because we have to cnvert 2023-7-1 to 2023-07-01
  const localeMatchDate = `${year}-${month}-${day}`;
  return localeMatchDate === curDate;
};
const refineFootballDate = (dirtyStartTime, timeZoneDiff) => {
  const sign = timeZoneDiff.at(0);
  // + to change into number
  const laggedMinute = +timeZoneDiff.split(':').at(1);
  const startTimeMs = new Date(dirtyStartTime).getTime();
  let newDate;
  if (laggedMinute > 30) {
    if (sign === '+') {
      newDate = new Date(startTimeMs - (60 - laggedMinute) * 60000);
    }
    // JUST A ALGORITHMMMM
    if (sign === '-') {
      newDate = new Date(startTimeMs + (60 - laggedMinute) * 60000);
    }
  }
  if (laggedMinute < 30) {
    if (sign === '+') {
      newDate = new Date(startTimeMs + laggedMinute * 60000);
    }
    if (sign === '-') {
      newDate = new Date(startTimeMs - laggedMinute * 60000);
    }
  }
  const localeDate = newDate.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const [date, time] = localeDate.split(',');
  // Because it is the format of en-Us.
  const [month, day, year] = date.split('/');
  // To convert it into same form as APIs'.
  return `${year}-${month}-${day}${time}`;
};
const fetchData = async (url, errorMsg, provider = 'sofascore') => {
  const res = await fetch(
    url,
    provider === 'sofascore' ? sportApiOptions : footballApiOptions
  );
  if (
    res.status === 404 ||
    res.status === 429 ||
    res.status === 403 ||
    res.status === 422 ||
    res.status === 522
  ) {
    handleError(errorMsg);
  }
  if (provider === 'sofascore') {
    const { data } = await res.json();
    return data;
  }
  if (provider === 'livescore') {
    const { DATA } = await res.json();
    return DATA;
  }
};
module.exports = {
  getMatchDate,
  refineFootballDate,
  fetchData,
  checkCurrentDayMatch,
};
