import { expect } from 'chai';
import Nokia from '../lib/nokia';
import { NokiaData } from '../types';

describe('nokia', () => {
  it('should be able to translate data', async() => {
    let translated:NokiaData = Nokia.translate(JSON.parse(
      '{\"updatetime\":616,\"timezone\":\"foo\",\"measuregrps\":[{\"grpid\":616,\"attrib\":2,\"date\":616,\"created\":616,\"category\":1,\"deviceid\":null,\"hash_deviceid\":null,\"measures\":[{\"value\":616,\"type\":9,\"unit\":0,\"algo\":0,\"fm\":616},{\"value\":616,\"type\":10,\"unit\":0,\"algo\":0,\"fm\":616},{\"value\":616,\"type\":11,\"unit\":0,\"algo\":0,\"fm\":616}],\"comment\":null}]}'
    ));
    expect(translated.measuregrps[0].measures[0].type).to.equal('Diastolic Blood Pressure (mmHg)');
    expect(translated.measuregrps[0].category).to.equal('Real measurement');
    expect(translated.measuregrps[0].attrib).to.equal('The measuregroup has been entered manually for this particular user');
    expect(Object.keys(translated.measuregrps[0].measures[0])).to.include('power_of_ten_multiplier');
  }).timeout(0);
});
