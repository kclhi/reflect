import {expect} from 'chai';
import {FastifyRequest} from 'fastify';
import proxyquire from 'proxyquire';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';

describe('handler', () => {
  it('should respond', async() => {
    const event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    const context:FunctionContext = new FunctionContext();
    const handler = proxyquire('../handler', {amqplib: require('mock-amqplib')});
    await handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);
});
