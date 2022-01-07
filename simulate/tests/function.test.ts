import { expect } from 'chai';
import { FastifyRequest } from 'fastify';
import proxyquire from 'proxyquire';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';

describe('handler', () => {
  it('should respond', async() => {
    let event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    let context:FunctionContext = new FunctionContext();
    let handler = proxyquire('../handler', {'amqplib':require('mock-amqplib')});
    await handler.default(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);
});
