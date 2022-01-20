import { expect } from 'chai';
import { FastifyRequest } from 'fastify';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';
import proxyquire from 'proxyquire';
import mockFs from 'mock-fs';
import path from 'path';
import nock from 'nock';
import { promises as fs } from 'fs';
import { Push } from '../types';
import { Console } from 'winston/lib/winston/transports';

describe('handler', function() {
  
  this.timeout(0);

  before(async function() {
    // test data
    let notification:Push = JSON.parse(await fs.readFile(path.resolve('tests/fixtures/garmin-notification-data.json'), 'utf8'));
    this.notification = {"body":notification};
    proxyquire.noPreserveCache();
    // queue mock
    this.handler = proxyquire('../handler', {'amqplib':require('mock-amqplib')});
    // fs mock
    let mocks:any = {'/tls': {'cert.crt':'foo', 'key.key':'bar', 'ca.pem':'baz'}};
    try { fs.access('node_modules'); mocks['node_modules']=mockFs.load(path.resolve('node_modules')); } catch(error) {}
    try { fs.access('../node_modules'); mocks['../node_modules']=mockFs.load('../node_modules'); } catch(error) {}
    mockFs(mocks);
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

  it('should respond when different notification', async function() {
    let event:FunctionEvent = new FunctionEvent({"body":{}} as FastifyRequest);
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

  it('should respond when no body', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    nock(process.env.internal_service_url).post('/id/garmin').reply(200, {'patientId':'foo'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond', async function() {
    let event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    nock(process.env.internal_service_url).post('/id/garmin').reply(200, {'patientId':'foo'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  after(function() {
    process.env = this.env;
    mockFs.restore();
  });

});
