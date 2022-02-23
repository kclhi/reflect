import {expect} from 'chai';
import build from '../src/app';
import cookieParser from 'set-cookie-parser';

describe('basic', () => {
  it('can create cookie (entry)', async() => {
    const app = await build();
    const setIdCookie = await app.inject({method: 'POST', url: '/device/setIdCookie', payload: {patientId: 'quuz'}});
    expect(cookieParser.parseString(setIdCookie.headers['set-cookie']?.toString()).name).to.equal(
      app.config.PATIENT_ID_COOKIE
    );
  }).timeout(0);

  it('can create cookie (query params)', async() => {
    const app = await build();
    const setIdCookie = await app.inject({method: 'GET', url: '/device/register?patientId=quuz'});
    console.log(cookieParser.parseString(setIdCookie.headers['set-cookie']?.toString()));
    expect(cookieParser.parseString(setIdCookie.headers['set-cookie']?.toString()).name).to.equal(
      app.config.PATIENT_ID_COOKIE
    );
  }).timeout(0);
});
