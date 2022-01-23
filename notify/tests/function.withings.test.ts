import {expect} from 'chai';
import {FastifyRequest} from 'fastify';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';
import proxyquire from 'proxyquire';
import mockFs from 'mock-fs';
import path from 'path';
import nock from 'nock';
import {promises as fs} from 'fs';
import {WithingsData, Notification} from '../types';
import config from '../config';

describe('handler', function() {
  this.timeout(0);

  before(async function() {
    // test data
    const notification:Notification = {
      userid: '616',
      startdate: 716,
      enddate: 816,
      appli: 4
    };
    this.notification = {body: notification};
    const withingsDataResponse:WithingsData = JSON.parse(
      await fs.readFile(path.resolve(__dirname, './fixtures/withings-data-response.json'), 'utf8')
    );
    this.withingsDataResponse = withingsDataResponse;
    proxyquire.noPreserveCache();
    // queue mock
    this.handler = proxyquire('../handler', {
      amqplib: require('mock-amqplib')
    });
    // fs mock
    config.WITHINGS_API_DATA.URLS.getmeas = 'https://mocked';
    // fs mock
    const mocks:any = {
      '/tls': {'cert.crt': 'foo', 'key.key': 'bar', 'ca.pem': 'baz'}
    };
    try {
      fs.access('node_modules');
      mocks['node_modules'] = mockFs.load(path.resolve('node_modules'));
    } catch(error) {
      // empty
    }
    try {
      fs.access('../node_modules');
      mocks['../node_modules'] = mockFs.load('../node_modules');
    } catch(error) {
      // empty
    }
    mockFs(mocks);
    // env stub
    this.env = Object.assign({}, process.env);
    process.env.CERT_PATH = '/tls/cert.crt';
    process.env.KEY_PATH = '/tls/key.key';
    process.env.CA_PATH = '/tls/ca.pem';
    // for http call mock
    process.env.INTERNAL_SERVICE_URL = 'https://mocked';
  });

  it('should respond when no notification', async function() {
    const event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no patient id', async function() {
    const event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no token', async function() {
    const event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    nock(process.env.INTERNAL_SERVICE_URL).post('/id/withings').reply(200, {patientId: 'foo'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond when no body', async function() {
    const event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    nock(process.env.INTERNAL_SERVICE_URL).post('/id/withings').reply(200, {patientId: 'foo'});
    nock(process.env.INTERNAL_SERVICE_URL).post('/token').reply(200, {token: 'bar'});
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond', async function() {
    const event:FunctionEvent = new FunctionEvent(this.notification as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    nock(process.env.INTERNAL_SERVICE_URL).post('/id/withings').reply(200, {patientId: 'foo'});
    nock(process.env.INTERNAL_SERVICE_URL).post('/token').reply(200, {token: 'bar'});
    nock(process.env.INTERNAL_SERVICE_URL)
      .get('/')
      .query({
        access_token: 'bar',
        action: 'getmeas',
        userid: '616',
        startdate: '716',
        enddate: '816'
      })
      .reply(200, this.withingsDataResponse);
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  after(function() {
    process.env = this.env;
    mockFs.restore();
  });
});
