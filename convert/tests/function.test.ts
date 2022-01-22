import {expect} from 'chai';
import {FastifyRequest} from 'fastify';
import handler from '../handler';
import FunctionContext from './function-context';
import FunctionEvent from './function-event';

describe('handler', () => {
  it('should be able to reach handler', async() => {
    const event:FunctionEvent = new FunctionEvent({} as FastifyRequest);
    const context = new FunctionContext();
    await handler(event, context);
    expect(context.statusCode).to.equal(200);
  }).timeout(0);
});
