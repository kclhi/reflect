import { IncomingHttpHeaders, OutgoingHttpHeaders } from 'http';

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
  error:Error|null;
  code(statusCode?: number):this;
  headers(headerValues?:OutgoingHttpHeaders):this;
  send(result:unknown):this;
  err(error:Error):this;
}

export interface Notification {
  userid:string;
  startdate:number;
  enddate:number;
  appli:number;
}

export type PatientId = { patientId:string }

export type Token = { token:string }

export interface Measure {
  value:number;
  type:string;
  algo:number;
  fm:number;
  power_of_ten_multiplier:number;
}

export interface MeasureGroup {
  grpid:number;
  attrib:string;
  data:number;
  created:number;
  category:string;
  deviceid:string|null;
  hash_deviceid:string|null;
  measures:Array<Measure>;
}

export interface WithingsData {
  updatetime:number;
  timezone:string;
  measuregrps:Array<MeasureGroup>;
  comment:string|null;
}

export interface Config {
  WITHINGS_API_DATA:{
    TYPES:{
      getmeas:string,
      getactivity:string, 
      getintradayactivity:string, 
      getsummary:string
    },
  	URLS:{
      getmeas:string, 
      getactivity:string, 
      getintradayactivity:string, 
      getsummary:string
    },
  	START:{
      getmeas:string,
      getactivity:string, 
      getintradayactivity:string, 
      getsummary:string
    },
  	END:{
      getmeas:string, 
      getactivity:string, 
      getintradayactivity:string, 
      getsummary:string
    }
  }
}

export interface BloodPressureReading {
  identifier:string;
  subject:string;
  performer:string;
  dbp:number;
  sbp:number;
  hr:number;
}
