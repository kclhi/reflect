import {expect} from 'chai';
import nock from 'nock';

import build from '../src/app';

describe('api', () => {
  it('fhir endpoint should be reachable', async() => {
    const app = await build();
    nock('https://' + app.config.INTERNAL_API_URL)
      .get('/fhir/Observation?subject=foo')
      .reply(200, '');
    const getResource = await app.inject({method: 'POST', url: '/api/fhir', payload: {patientId: 'foo'}});
    expect(getResource.statusCode).to.equal(200);
    expect(getResource.body).to.equal('{"resource":""}');
  }).timeout(0);
});
