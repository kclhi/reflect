import {expect} from 'chai';
import {FastifyRequest} from 'fastify';
import proxyquire from 'proxyquire';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';
import {promises as fs} from 'fs';
import mockFs from 'mock-fs';
import path from 'path';

describe('handler', () => {
  before(async function() {
    this.timeout(0);
    // import mocks
    proxyquire.noCallThru();
    const simulationData = [{"identifier": "foo", "subject": "bar", "performer": "baz", "sbp": 616, "dbp": 816, "hr": 916, "date": "qux"}];
    this.handler = await proxyquire('../handler', {
      amqplib: require('mock-amqplib'),
      './data': simulationData
    });
    // fs mock
    const mocks:any = {'/tls': {'cert.crt': 'foo', 'key.key': 'bar', 'ca.pem': 'baz'}};
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
    await mockFs(mocks);
    // env stub
    this.env = Object.assign({}, process.env);
    process.env.CERT_PATH = '/tls/cert.crt';
    process.env.KEY_PATH = '/tls/key.key';
    process.env.CA_PATH = '/tls/ca.pem';
   
  });
  it('should respond', async function() {
    const event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    await this.handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);

  after(function() {
    process.env = this.env;
    mockFs.restore();
  });
});
