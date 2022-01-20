import { expect } from 'chai';
import Garmin from '../lib/garmin';
import { Push } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

describe('garmin', () => {
  
  it('should be able to calculate intensity', async() => {
    let notification:Push = JSON.parse(await fs.readFile(path.resolve('tests/fixtures/garmin-notification-data.json'), 'utf8'));
    expect(Garmin.getIntensity(120, 120, 1642550400000)).to.be.above(0);
    expect(Garmin.getIntensityFromDaily(notification.dailies[0])).to.equal(0);
  }).timeout(0);

});
