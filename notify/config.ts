export default {
  WITHINGS_API_DATA: {
    TYPES: {getmeas: 'measuregrps', getactivity: 'activities', getintradayactivity: 'series', getsummary: ''},
    URLS: {
      getmeas: 'https://wbsapi.withings.net/measure',
      getactivity: 'https://wbsapi.withings.net/v2/measure',
      getintradayactivity: 'https://wbsapi.withings.net/v2/measure',
      getsummary: 'https://wbsapi.withings.net/v2/sleep'
    },
    START: {
      getmeas: 'startdate',
      getactivity: 'startdateymd',
      getintradayactivity: 'startdate',
      getsummary: 'startdateymd'
    },
    END: {getmeas: 'enddate', getactivity: 'enddateymd', getintradayactivity: 'enddate', getsummary: 'enddateymd'}
  }
};
