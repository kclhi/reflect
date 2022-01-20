import { Daily } from '../types';

export default class Garmin {

  static getIntensityFromDaily(daily:Daily):number {
    // startTimeInSeconds from api is missing trailing zeros
    if(daily.moderateIntensityDurationInSeconds&&daily.vigorousIntensityDurationInSeconds&&daily.startTimeInSeconds) return Garmin.getIntensity(daily.moderateIntensityDurationInSeconds, daily.vigorousIntensityDurationInSeconds, parseInt(daily.startTimeInSeconds+'000'));
    return 0;
  }

  static getIntensity(moderateIntensityDurationInSeconds:number, vigorousIntensityDurationInSeconds:number, startTimeInSeconds:number):number {
    const totalActivitySeconds = moderateIntensityDurationInSeconds+vigorousIntensityDurationInSeconds;
    const secondsInMeasurementRange = (Date.now()-startTimeInSeconds)/1000;
    if(totalActivitySeconds>0&&secondsInMeasurementRange>0) {
      const intensityDurationPercentage = (totalActivitySeconds/secondsInMeasurementRange)*100;
      return Math.round(intensityDurationPercentage*100)/100;
    }
    return 0;
  }

}
