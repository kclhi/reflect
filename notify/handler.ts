import {
  ContextPayload,
  EventPayload,
  Config,
  Notification,
  PatientId,
  Token,
  WithingsData,
  BloodPressureReading
} from './types';
import winston from 'winston';
import {promises as fs} from 'fs';
import got, {Response} from 'got';
import amqp, {Connection, Channel} from 'amqplib';
import Withings from './lib/withings';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.simple(),
    transports: [new winston.transports.Console({stderrLevels: ['error']})]
  });
  const config:Config = JSON.parse(await fs.readFile('./config.json', 'utf8'));

  // ~mdc send positive response to withings regardless (also acks initial HEAD request from withings when setting up notifications)
  if(!event.body) {
    logger.debug('no request body, stopping...');
    return context.code(200).send('');
  }
  logger.debug('received notification: ' + JSON.stringify(event.body));

  const notification:Notification = event.body as Notification;
  const userId:string = notification.userid;
  if(!userId) {
    logger.debug('no user id, stopping...');
    return context.code(200).send('');
  }
  logger.debug('got user id');

  // get patient id to associate this data with
  let getPatientId:Response<PatientId>;
  try {
    getPatientId = await got.post<PatientId>(process.env.INTERNAL_SERVICE_URL + '/id/withings', {
      json: {vendorId: userId},
      username: process.env.USER,
      password: process.env.PASSWORD,
      responseType: 'json'
    });
    if(getPatientId.statusCode != 200) throw new Error(getPatientId.statusCode + ' ' + getPatientId.body.toString());
  } catch(error) {
    logger.error('error getting patient id: ' + error);
  }

  if(!getPatientId?.body.patientId) {
    logger.debug('no patient id, stopping...');
    return context.code(200).send('');
  }
  logger.debug('got patient id');

  // get access token to get data
  let getToken:Response<Token>;
  try {
    getToken = await got.post<Token>(process.env.INTERNAL_SERVICE_URL + '/token', {
      json: {vendorId: userId},
      username: process.env.USER,
      password: process.env.PASSWORD,
      responseType: 'json'
    });
    if(getToken.statusCode != 200) throw new Error(getToken.statusCode + ' ' + getToken.body.toString());
  } catch(error) {
    logger.error('error getting token: ' + error);
  }

  if(!getToken?.body.token) {
    logger.debug('no token, stopping...');
    return context.code(200).send('');
  }
  logger.debug('got token');

  // get data
  const params:any = {
    action: 'getmeas',
    userid: notification.userid,
    [config.WITHINGS_API_DATA.START.getmeas]: notification.startdate,
    [config.WITHINGS_API_DATA.END.getmeas]: notification.enddate
  };
  let getData:Response;
  try {
    const dataUrl:string =
      config.WITHINGS_API_DATA.URLS.getmeas +
      '?access_token=' +
      getToken.body.token +
      '&' +
      Withings.genQueryString(params);
    logger.debug('data url: ' + dataUrl);
    getData = await got.get(dataUrl, {responseType: 'json'});
    if(getData.statusCode != 200) throw new Error(getData.statusCode + ' ' + getData.body.toString());
  } catch(error) {
    logger.error('error getting data: ' + error);
  }
  logger.debug(JSON.stringify(getData?.body));
  logger.debug(JSON.stringify(getData?.body['body']));

  if(!getData?.body) {
    logger.debug('no data, stopping...');
    return context.code(200).send('');
  }
  logger.debug('got data');

  // parse data
  const translatedBodyData:WithingsData = Withings.translate(getData.body['body']);
  logger.debug(JSON.stringify(translatedBodyData));
  const sbp:number = Withings.getReading(translatedBodyData, 'systolic');
  const dbp:number = Withings.getReading(translatedBodyData, 'diastolic');
  const hr:number = Withings.getReading(translatedBodyData, 'heart');
  logger.debug('received values: ' + sbp + ' ' + dbp + ' ' + hr);

  // send data
  if(sbp && dbp && hr) {
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
      await channel.assertExchange(process.env.EXCHANGE_NAME, 'direct', {
        durable: false
      });
      channel.publish(
        process.env.EXCHANGE_NAME,
        process.env.EXCHANGE_TOPIC,
        Buffer.from(
          JSON.stringify({
            identifier: null,
            subject: getPatientId.body.patientId,
            performer: 'da6da8b0-56e5-11e9-8d7b-95e10210fac3',
            sbp: sbp,
            dbp: dbp,
            hr: hr
          } as BloodPressureReading)
        ),
        {contentType: 'application/json'}
      );
      logger.debug('sent information to queue');
      await channel.close();
      await connection.close();
    } catch(error) {
      logger.error('error sending information to queue: ' + error);
      if(connection) connection.close();
    }
  }
  return context.code(200).send('');
};
