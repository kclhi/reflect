import {IncomingHttpHeaders, OutgoingHttpHeaders} from 'http';

export interface EventPayload {
  body:unknown;
  headers:IncomingHttpHeaders;
  method:string;
  query:unknown;
  path:string;
}

export interface ContextPayload {
  statusCode:number;
  headerValues:OutgoingHttpHeaders;
  result:unknown;
  error:Error | null;
  code(statusCode?:number):this;
  headers(headerValues?:OutgoingHttpHeaders):this;
  send(result:unknown):this;
  err(error:Error):this;
}

export type PatientId = {patientId:string};

export interface Daily {
  userId:string;
  userAccessToken:string;
  summaryId:string;
  calendarDate:string;
  activityType:string;
  activeKilocalories:number;
  bmrKilocalories:number;
  steps:number;
  distnaceInMeters:number;
  durationInSeconds:number;
  activeTimeInSeconds:number;
  startTimeInSeconds:number;
  startTimeOffsetInSeconds:number;
  moderateIntensityDurationInSeconds:number;
  vigorousIntensityDurationInSeconds:number;
  floorsClimbed:number;
  minHeartRateInBeatsPerMinute:number;
  maxHeartRateInBeatsPerMinute:number;
  averageHeartRateInBeatsPerMinute:number;
  restingHeartRateInBeatsPerMinute:number;
  timeOffsetHeartRateSamples:Array<number>;
  stepsGoal:number;
  intensityDurationGoalInSeconds:number;
  floorsClimbedGoal:number;
  averageStressLevel:number;
  maxStressLevel:number;
  stressDurationInSeconds:number;
  restStressDurationInSeconds:number;
  activityStressDurationInSeconds:number;
  lowStressDurationInSeconds:number;
  mediumStressDurationInSeconds:number;
  highStressDurationInSeconds:number;
  stressQualifier:string;
}

export interface Push {
  dailies:Array<Daily>;
}

export interface HeartRateReading {
  identifier:string;
  subject:string;
  performer:string;
  resting:number;
  rate:number;
  intensity:number;
}
