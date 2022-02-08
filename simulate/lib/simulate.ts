export default class Simulate {
  static sigma(value:number):number {
    return (value * (value + 1)) / 2;
  }

  static generateSimulationValuesWithDistribution(
    from:Date,
    to:Date,
    thresholds:number[],
    minimum:number,
    key:any
  ):any {
    const distribution = {};
    const values = {};
    while(from < to) {
      // Later thresholds are more common
      const sbp = Math.random();
      for(const [index, _reading] of thresholds.entries()) {
        const cutoff = Simulate.sigma(index + 1) / Simulate.sigma(thresholds.length);
        if(sbp < cutoff) {
          const min = index - 1 > 0 ? thresholds[index - 1] : minimum;
          const thresholdKey = key[thresholds[index]];
          distribution[thresholdKey] = distribution[thresholdKey] + 1 || 1;
          values[from.toISOString()] = Math.floor(Math.random() * (thresholds[index] - min + 1)) + min;
          break;
        }
      }
      from.setDate(from.getDate() + 2);
    }
    // console.log(distribution)
    return [values, distribution];
  }

  static generateSimulationValues(from:Date, to:Date, thresholds:number[], minimum:number, key:any):any {
    return Simulate.generateSimulationValuesWithDistribution(from, to, thresholds, minimum, key)[0];
  }

  static generateSBP(from:Date, to:Date, subject:string) {
    const thresholds:number[] = [200, 179, 159, 139, 120, 130];
    const key:any = {200: 'high', 179: 'moderate', 159: 'mild', 139: 'high normal', 120: 'optimal', 130: 'normal'};
    return Object.entries(Simulate.generateSimulationValues(from, to, thresholds, 90, key)).map(([date, value]) => {
      return {identifier: date + value, subject: subject, performer: 'bar', sbp: value, dbp: 0, hr: 0, date: date};
    });
  }
}
