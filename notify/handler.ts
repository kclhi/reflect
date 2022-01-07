import { ContextPayload, EventPayload, Config, Notification, PatientId, Token, WithingsData, BloodPressureReading } from './types';
import winston from 'winston';
import { promises as fs } from 'fs';
import got, { Response } from 'got';
import amqp, { Connection, Channel } from 'amqplib';
import Withings from './lib/withings';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  
  const logger = winston.createLogger({level:'debug', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  const config:Config = require('./config.json');
  logger.debug('received notification: '+JSON.stringify(event.body));

  // ~mdc send positive response to withings regardless (also acks initial HEAD request from withings when setting up notifications)
  if(!event.body) { logger.debug('no request body, stopping...'); return context.code(200).send(''); }

  // get patient id to associate this data with
  let getPatientId:Response<PatientId>;
  try {
    let userId:string = (event.body as Notification).userid;
    getPatientId = await got.post<PatientId>(process.env.internal_service_url+'/id', {json:{"withingsId":userId}, username:process.env.user, password:process.env.password, responseType:'json'});
    if(getPatientId.statusCode!=200) throw new Error(getPatientId.statusCode+' '+getPatientId.body.toString());
  } catch(error) {
    logger.error('error getting patient id: '+error);
  }

  if(!getPatientId?.body.patientId) { logger.debug('no patient id, stopping...'); return context.code(200).send(''); }
  logger.debug('got patient id');

  // get access token to get data
  let getToken:Response<Token>;
  try {
    let userId:string = (event.body as Notification).userid;
    getToken = await got.post<Token>(process.env.internal_service_url+'/token', {json:{"withingsId":userId}, username:process.env.user, password:process.env.password, responseType:'json'});
    if(getToken.statusCode!=200) throw new Error(getToken.statusCode+' '+getToken.body.toString());
  } catch(error) {
    logger.error('error getting token: '+error);
  }

  if(!getToken?.body.token) { logger.debug('no token, stopping...'); return context.code(200).send(''); }
  logger.debug('got token');

  // get data
  let params:any = {action:'getmeas', userid:(event.body as Notification).userid, [config.WITHINGS_API_DATA.START.getmeas]:(event.body as Notification).startdate, [config.WITHINGS_API_DATA.END.getmeas]:(event.body as Notification).enddate};
  let getData:Response;
  try {
    const dataUrl:string = config.WITHINGS_API_DATA.URLS.getmeas+'?access_token='+getToken.body.token+'&'+Withings.genQueryString(params);
    logger.debug('data url: '+dataUrl);
    getData = await got.get(dataUrl, {responseType:'json'});
    if(getData.statusCode!=200) throw new Error(getData.statusCode+' '+getData.body.toString());
  } catch(error) {
    logger.error('error getting data: '+error);
  }
  logger.debug(JSON.stringify(getData?.body));
  logger.debug(JSON.stringify(getData?.body['body']));

  if(!getData?.body) { logger.debug('no data, stopping...'); return context.code(200).send(''); }
  logger.debug('got data');

  // parse data
  let translatedBodyData:WithingsData = Withings.translate(getData.body['body']);
  logger.debug(JSON.stringify(translatedBodyData));
  let sbp:number = Withings.getReading(translatedBodyData, 'systolic');
  let dbp:number = Withings.getReading(translatedBodyData, 'diastolic');
  let hr:number = Withings.getReading(translatedBodyData, 'heart');

  // send data
  if(sbp&&dbp&&hr) {
    logger.debug('received values: '+sbp+' '+dbp+' '+hr);
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
        "identifier":getPatientId.body.patientId,
        "subject":getPatientId.body.patientId,
        "performer":"da6da8b0-56e5-11e9-8d7b-95e10210fac3",
        "sbp":sbp,
        "dbp":dbp,
        "hr":hr
      } as BloodPressureReading)), {"contentType": "application/json"});
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
