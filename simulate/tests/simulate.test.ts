import {expect} from 'chai';
import Simulate from '../lib/simulate';

describe('simulate', () => {
  it('should be able to generate simulation data', async function() {
    const values = Simulate.generateSBP(new Date('2020-04-17T03:24:00'), new Date('2021-04-17T03:24:00'), 'u70');
    expect(values[0]).to.have.property('date');
  }).timeout(0);
  it('generate simulation data should match expected distribution', async function() {
    const valuesAndDistribution = Simulate.generateSimulationValuesWithDistribution(
      new Date('1995-11-17T03:24:00'),
      new Date('2005-12-17T03:24:00'),
      [200, 179, 159, 139, 120, 130],
      90,
      {200: 'high', 179: 'moderate', 159: 'mild', 139: 'high normal', 120: 'optimal', 130: 'normal'}
    );
    expect(valuesAndDistribution[1].normal).to.be.above(valuesAndDistribution[1].high);
  }).timeout(0);
});
