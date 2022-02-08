import {ContextPayload, EventPayload, BloodPressureReading} from './types';
import winston from 'winston';
import {promises as fs} from 'fs';
import amqp, {Connection, Channel} from 'amqplib';
import data from './data';
import Simulate from './lib/simulate';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.simple(),
    transports: [new winston.transports.Console({stderrLevels: ['error']})]
  });
  let opts:any, connection:Connection;
  try {
    opts = {
      cert: await fs.readFile(process.env.CERT_PATH),
      key: await fs.readFile(process.env.KEY_PATH),
      ca: [await fs.readFile(process.env.CA_PATH)]
    };
  } catch(error) {
    logger.error('error reading tls information: ' + error);
  }
  try {
    logger.debug('opening connection to queue');
    connection = await amqp.connect(
      'amqps://' + process.env.QUEUE_USERNAME + ':' + process.env.QUEUE_PASSWORD + '@' + process.env.QUEUE_HOST,
      opts
    );
    const channel:Channel = await connection.createChannel();
    await channel.assertExchange(process.env.EXCHANGE_NAME, 'direct', {durable: false});
    for(const reading of Simulate.generateSBP(
      new Date('2020-04-17T03:24:00'),
      new Date('2021-04-17T03:24:00'),
      'u68'
    )) {
      channel.publish(
        process.env.EXCHANGE_NAME,
        process.env.EXCHANGE_TOPIC,
        Buffer.from(
          JSON.stringify({
            identifier: reading.identifier,
            subject: reading.subject,
            performer: reading.performer,
            sbp: reading.sbp,
            dbp: reading.dbp,
            hr: reading.hr,
            date: reading.date
          } as BloodPressureReading)
        ),
        {contentType: 'application/json'}
      );
      logger.debug('sent information to queue: ' + JSON.stringify(reading));
    }
    await channel.close();
    await connection.close();
  } catch(error) {
    logger.error('error sending information to queue: ' + error);
    if(connection) connection.close();
  }
  return context.code(200).send('');
};
