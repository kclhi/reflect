import { expect } from 'chai';
import dbHandler from './db-handler';
import { ImportMock } from 'ts-mock-imports';
import cookieParser from 'set-cookie-parser';

import build from '../src/app';
import * as WithingsModule from '../src/modules/lib/withings';
import Withings from '../src/modules/lib/withings';
import { WithingsModel } from '../src/modules/db/models/withings';

let handler:dbHandler;

before(async()=>{handler = await dbHandler.factory(); await handler.connect();});
afterEach(async()=>await handler.clearDatabase());
after(async()=>{await handler.closeDatabase();});

describe('user', () => {
  
  const accessTokenResponse = {access_token:'foo', expires_in:616, token_type:'bar', scope:'baz', refresh_token:'qux', userid:'quux'};

  function init() {
    const mockManager = ImportMock.mockStaticClass(WithingsModule);
    mockManager.mock('getAccessToken', accessTokenResponse);
    mockManager.mock('subscribeToNotifications', true);
    mockManager.mock('refreshAccessToken', accessTokenResponse);
  }
  
  async function getUserCredentials(app) {
    const setIdCookie = await app.inject({method:'POST', url:'/device/setIdCookie', payload:{'patientId':'quuz'}});
    const addUser = await app.inject({method:'GET', url:'/withings/callback?code=00DEF&state=XYZ', cookies:{[app.config.PATIENT_ID_COOKIE]:cookieParser.parseString(setIdCookie.headers['set-cookie']?.toString()||'').value}});
    expect(addUser.statusCode).to.equal(200);
    expect(await WithingsModel.find({'_id':'quuz'})).to.have.lengthOf(1);
  }
  
  it('can create user', async() => {
    const app = await build();
    init();
    await getUserCredentials(app);
    ImportMock.restore();
  }).timeout(0);

  it('can get user', async() => {
    const app = await build();
    init();
    await getUserCredentials(app);
    const getUser = await app.inject({method:'POST', url:'/internal/id', payload:{'withingsId':'quux'}});
    expect(getUser.statusCode).to.equal(200);
    expect(getUser.body).to.equal('{"patientId":"quuz"}');
    ImportMock.restore();
  }).timeout(0);

  it('can get token', async() => {
    const app = await build();
    init();
    await getUserCredentials(app);
    const getToken = await app.inject({method:'POST', url:'/internal/token', payload:{'withingsId':'quux'}});
    expect(getToken.statusCode).to.equal(200);
    expect(getToken.body).to.equal('{"token":"foo"}');
    ImportMock.restore();
  }).timeout(0);

  it('can create query string', async() => {
    expect(Withings.genQueryString({action:'foo', actionBar:'baz', qux:'quux'})).to.equal('action=foo&actionBar=baz&oauth_qux=quux');
  }).timeout(0);

});
