import { ContextPayload, Daily, EventPayload, HeartRateReading, PatientId, Push } from './types';
import got, { Response } from 'got';
import winston from 'winston';
import { promises as fs } from 'fs';
import amqp, { Connection, Channel } from 'amqplib';
import Garmin from './lib/garmin';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {

  const logger = winston.createLogger({level:'debug', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  logger.debug('received notification: '+JSON.stringify(event.body));

  if(!event.body) { logger.debug('no request body, stopping...'); return context.code(200).send(''); }

  let notifications:Array<Daily> = (event.body as Push).dailies;
  let userId:string|null = notifications?notifications[0].userId:null;
  if(!userId) { logger.debug('no user id, stopping...'); return context.code(200).send(''); }
  logger.debug('got user id');

  // get patient id to associate this data with
  let getPatientId:Response<PatientId>;
  try {
    getPatientId = await got.post<PatientId>(process.env.internal_service_url+'/id/garmin', {json:{"vendorId":notifications[0].userAccessToken}, username:process.env.user, password:process.env.password, responseType:'json'});
    if(getPatientId.statusCode!=200) throw new Error(getPatientId.statusCode+' '+getPatientId.body.toString());
  } catch(error) {
    logger.error('error getting patient id: '+error);
  }

  if(!getPatientId?.body.patientId) { logger.debug('no patient id, stopping...'); return context.code(200).send(''); }
  logger.debug('got patient id');

  // process data
  let resting:number = notifications[0].restingHeartRateInBeatsPerMinute;
  let rate:number = notifications[0].maxHeartRateInBeatsPerMinute;
  let intensity:number = Garmin.getIntensityFromDaily(notifications[0]);
  logger.debug('received values: '+resting+' '+rate+' '+intensity);

  // send data
  if(resting&&rate&&intensity!==undefined) {
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
        "identifier":notifications[0].summaryId,
        "subject":getPatientId.body.patientId,
        "performer":"da6da8b0-56e5-11e9-8d7b-95e10210fac3",
        "resting":resting,
        "rate":rate,
        "intensity":intensity
      } as HeartRateReading)), {"contentType": "application/json"});
      logger.debug('sent information to queue');
      await channel.close();
      await connection.close();
    } catch(error) {
      logger.error('error sending information to queue: '+error);
      if(connection) connection.close();
    }
  }
  return context.code(200).send('');

};
