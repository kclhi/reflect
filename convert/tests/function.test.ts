import {BloodPressureReading, HeartRateReading} from '../types';
import {expect} from 'chai';
import {FastifyRequest} from 'fastify';
import nock from 'nock';
import handler from '../handler';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';

describe('handler', () => {
  before(async function() {
    // env stub
    this.env = Object.assign({}, process.env);
    process.env.INTERNAL_API_URL = 'mocked';
  });
  beforeEach(async function() {
    // http call mock
    nock('https://' + process.env.INTERNAL_API_URL)
      .filteringPath((path) => '/')
      .post('/')
      .reply(200, {});
    nock('https://' + process.env.INTERNAL_API_URL)
      .filteringPath((path) => '/')
      .put('/')
      .reply(200, {});
  });
  it('should respond when no data', async() => {
    const event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    const context = new FunctionContext();
    await handler(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond to bp data', async() => {
    const bpData:BloodPressureReading = {
      identifier: 'foo',
      subject: 'bar',
      performer: 'baz',
      dbp: 616,
      sbp: 716,
      hr: 816
    };
    const event:FunctionEvent = new FunctionEvent({body: bpData} as FastifyRequest);
    const context = new FunctionContext();
    await handler(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  it('should respond to hr data', async() => {
    const hrData:HeartRateReading = {
      identifier: 'qux',
      subject: 'quux',
      performer: 'quuz',
      resting: 616,
      rate: 716,
      intensity: 816
    };
    const event:FunctionEvent = new FunctionEvent({body: hrData} as FastifyRequest);
    const context = new FunctionContext();
    await handler(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  after(function() {
    process.env = this.env;
  });
});
