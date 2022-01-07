import { ContextPayload, EventPayload, BloodPressureReading } from './types';
import winston from 'winston';
import { promises as fs } from 'fs';
import amqp, { Connection, Channel } from 'amqplib';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({level:'debug', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  let opts:any, connection:Connection;
  try {
    opts = {cert:await fs.readFile(process.env.cert_path), key:await fs.readFile(process.env.key_path), ca:[await fs.readFile(process.env.ca_path)] }
  } catch(error) {
    logger.error('error reading tls information: '+error);
  }
  try {
    logger.debug('opening connection to queue');
    connection = await amqp.connect('amqps://'+process.env.queue_username+':'+process.env.queue_password+'@'+process.env.queue_host, opts);
    let channel:Channel = await connection.createChannel();
    await channel.assertExchange(process.env.exchange_name, 'direct', {durable: false });
    channel.publish(process.env.exchange_name, process.env.exchange_topic, Buffer.from(JSON.stringify({
      "identifier":"ufoo",
      "subject":"ufoo",
      "performer":"bar",
      "sbp":616,
      "dbp":716,
      "hr":816
    } as BloodPressureReading)), {"contentType": "application/json"});
    logger.debug('sent information to queue');
    await channel.close();
    await connection.close();
  } catch(error) {
    logger.error('error sending information to queue: '+error);
    if(connection) connection.close();
  }
  return context.code(200).send('');
};
