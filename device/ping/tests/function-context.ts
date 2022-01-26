import {OutgoingHttpHeaders} from 'http';
import {ContextPayload} from '../types';

export default class Context implements ContextPayload {
  statusCode:number;
  headerValues:OutgoingHttpHeaders;
  result:unknown;
  error:Error | null;

  constructor() {
    this.statusCode = 200;
    this.headerValues = {};
    this.result = null;
    this.error = null;
  }

  code(statusCode?:number):this {
    if(!statusCode) {
      return this;
    }
    this.statusCode = statusCode;
    return this;
  }

  headers(headerValues?:OutgoingHttpHeaders):this {
    if(!headerValues) {
      return this;
    }
    this.headerValues = headerValues;
    return this;
  }

  send(result:unknown):this {
    this.result = result;
    return this;
  }

  err(error:Error):this {
    this.error = error;
    return this;
  }
}
