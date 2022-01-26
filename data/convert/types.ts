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

export interface Reading {
  identifier:string;
  subject:string;
  performer:string;
  date:string;
}

export interface BloodPressureReading extends Reading {
  dbp:number;
  sbp:number;
  hr:number;
}

export interface HeartRateReading extends Reading {
  resting:number;
  rate:number;
  intensity:number;
}
