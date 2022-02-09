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

export interface BloodPressureReading {
  identifier:string;
  subject:string;
  performer:string;
  dbp:number;
  sbp:number;
  hr:number;
  date:string;
}

export interface HeartRateReading {
  identifier:string;
  subject:string;
  performer:string;
  resting:number;
  rate:number;
  intensity:number;
}
