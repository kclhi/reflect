import { expect } from 'chai';
import Nokia from '../lib/nokia';
import { NokiaData } from '../types';
import { promises as fs } from 'fs';
import path from 'path';

describe('nokia', () => {
  it('should be able to translate data', async() => {
    let translated:NokiaData = Nokia.translate(JSON.parse(await fs.readFile(path.resolve(__dirname, './fixtures/nokia-data-response.json'), 'utf8')).body);
    expect(translated.measuregrps[0].measures[0].type).to.equal('Diastolic Blood Pressure (mmHg)');
    expect(translated.measuregrps[0].category).to.equal('Real measurement');
    expect(translated.measuregrps[0].attrib).to.equal('The measuregroup has been entered manually for this particular user');
    expect(Object.keys(translated.measuregrps[0].measures[0])).to.include('power_of_ten_multiplier');
  }).timeout(0);
});
