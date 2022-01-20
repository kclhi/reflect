import { expect } from 'chai';
import cookieParser from 'set-cookie-parser';

import build from '../src/app';
import { GarminModel } from '../src/modules/db/models/garmin';

describe('user - garmin', () => {

  async function getUserCredentials(app) {
    const setIdCookie = await app.inject({method:'POST', url:'/device/setIdCookie', payload:{'patientId':'quuz'}});
    const addUser = await app.inject({method:'GET', url:'/connect/garmin/done?access_token=quux&access_secret=XYZ', cookies:{[app.config.PATIENT_ID_COOKIE]:cookieParser.parseString(setIdCookie.headers['set-cookie']?.toString()||'').value}});
    expect(addUser.statusCode).to.equal(200);
    expect(await GarminModel.find({'_id':'uquuz'})).to.have.lengthOf(1);
  }
  
  it('can create garmin user', async() => {
    const app = await build();
    await getUserCredentials(app);
  }).timeout(0);

  it('can get garmin user', async() => {
    const app = await build();
    await getUserCredentials(app);
    const getUser = await app.inject({method:'POST', url:'/internal/id/garmin', payload:{'vendorId':'quux'}});
    expect(getUser.statusCode).to.equal(200);
    expect(getUser.body).to.equal('{"patientId":"uquuz"}');
  }).timeout(0);

});
