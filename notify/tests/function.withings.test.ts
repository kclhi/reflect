import { expect } from 'chai';
import { FastifyRequest } from 'fastify';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';
import proxyquire from 'proxyquire';
import mockFs from 'mock-fs';
import path from 'path';
import nock from 'nock';
import { promises as fs } from 'fs';
import { Config, WithingsData, Notification } from '../types';

describe('handler', function() {
  
  this.timeout(0);

  before(async function() {
    // test data
    let notification:Notification = {"userid":"616","startdate":716,"enddate":816,"appli":4}; 
    this.notification = {"body":notification};
    let withingsDataResponse:WithingsData = JSON.parse(await fs.readFile(path.resolve(__dirname, './fixtures/withings-data-response.json'), 'utf8'));
    this.withingsDataResponse = withingsDataResponse;
    proxyquire.noPreserveCache();
    // queue mock
    this.handler = proxyquire('../handler', {'amqplib':require('mock-amqplib')});
    // fs mock
    let config:Config = JSON.parse(await fs.readFile(path.resolve(__dirname, '../config.json'), 'utf-8')) as Config;
    config.WITHINGS_API_DATA.URLS.getmeas='https://mocked';
    mockFs({
      '/tls': {'cert.crt': 'foo', 'key.key': 'bar', 'ca.pem': 'baz'},
      'node_modules': mockFs.load(path.resolve(__dirname, '../node_modules')),
      'config.json': JSON.stringify(config)
    });
    // env stub
    this.env = Object.assign({}, process.env);
    process.env.cert_path='/tls/cert.crt';
    process.env.key_path='/tls/key.key';
    process.env.ca_path='/tls/ca.pem';
    // for http call mock
    process.env.internal_service_url='https://mocked';
  });

  it('should respond when no notification', async function() {
    let event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no patient id', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no token', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    nock(process.env.internal_service_url).post('/id/withings').reply(200, {'patientId':'foo'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no body', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    nock(process.env.internal_service_url).post('/id/withings').reply(200, {'patientId':'foo'});
    nock(process.env.internal_service_url).post('/token').reply(200, {'token':'bar'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    nock(process.env.internal_service_url).post('/id').reply(200, {'patientId':'foo'});
    nock(process.env.internal_service_url).post('/token').reply(200, {'token':'bar'});
    nock(process.env.internal_service_url).get('/').query({'access_token':'bar', 'action':'getmeas', 'userid':'616', 'startdate':'716', 'enddate':'816'}).reply(200, this.withingsDataResponse);
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  after(function() {
    process.env = this.env;
    mockFs.restore();
  });

});
