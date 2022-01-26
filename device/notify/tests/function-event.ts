import {FastifyRequest} from 'fastify';
import {IncomingHttpHeaders} from 'http';
import {EventPayload} from '../types';

export default class Event implements EventPayload {
  body:unknown;
  headers:IncomingHttpHeaders;
  method:string;
  query:unknown;
  path:string;

  constructor(req:FastifyRequest) {
    this.body = req.body;
    this.headers = req.headers;
    this.method = req.method;
    this.query = req.query;
    this.path = req.url;
  }
}
