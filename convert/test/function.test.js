const chai = require('chai');
const expect = chai.expect;
const handler = require('../handler');
const FunctionContext = require('./function-context');
const FunctionEvent = require('./function-event');

describe('handler', () => {
  it('should be able to reach handler', async() => {
    let event = new FunctionEvent({});
    let cb = (err, val) => {};
    let context = new FunctionContext(cb);
    await handler(event, context);
    expect(context.status()).to.equal(200);
  }).timeout(0);
});
