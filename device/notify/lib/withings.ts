import {Measure, WithingsData} from '../types';

export default class Withings {
  static genQueryString(params:any) {
    let queryString = '';
    for(const param in params) {
      if(
        ['action', 'user_id', 'callbackurl', 'comment', 'appli', 'start', 'end', 'type', 'userid', 'date'].filter(
          (nonOauthParam) => param.includes(nonOauthParam)
        ).length
      )
        queryString += param + '=' + params[param] + '&';
      else queryString += 'oauth_' + param + '=' + params[param] + '&';
    }
    return queryString.substring(0, queryString.length - 1);
  }

  static translate(data:WithingsData):WithingsData {
    for(const key of Object.keys(data)) {
      if(data[key] != null && typeof data[key] === 'object') this.translate(data[key]);
      if(key == 'type') {
        data[key] =
          {
            1: 'Weight (kg)',
            4: 'Height (meters)',
            9: 'Diastolic Blood Pressure (mmHg)',
            10: 'Systolic Blood Pressure (mmHg)',
            11: 'Heart Pulse (bpm)'
          }[data[key]] || data[key];
      } else if(key == 'category') {
        data[key] =
          {
            1: 'Real measurement',
            2: 'User objective'
          }[data[key]] || data[key];
      } else if(key == 'attrib') {
        data[key] =
          {
            0: 'The measuregroup has been captured by a device and is known to belong to this user (and is not ambiguous)',
            1: 'The measuregroup has been captured by a device but may belong to other users as well as this one (it is ambiguous)',
            2: 'The measuregroup has been entered manually for this particular user',
            4: 'The measuregroup has been entered manually during user creation (and may not be accurate)',
            5: "Measure auto, it's only for the Blood Pressure Monitor. This device can make many measures and computed the best value",
            7: 'Measure confirmed. You can get this value if the user confirmed a detected activity'
          }[data[key]] || data[key];
      } else if(key == 'unit') {
        data['power_of_ten_multiplier'] = data[key];
        delete data[key];
      }
    }
    return data;
  }

  static getReading(data:WithingsData, reading:string):number {
    const measure:Measure = data.measuregrps[0]?.measures?.filter((measure) =>
      measure.type?.toLowerCase().includes(reading)
    )[0];
    return measure.value * Math.pow(10, measure.power_of_ten_multiplier);
  }
}
