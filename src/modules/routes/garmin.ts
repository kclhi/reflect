import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { Callback, CallbackType } from '../types/garmin'

export default async(server:FastifyInstance) => {

  server.addHook('onRequest', process.env.NODE_ENV&&process.env.NODE_ENV=="test"?(_req:any, _rep:any, done:any)=>{done()}:server.basicAuth);

  server.route<{Querystring:CallbackType}>({
    url:'/done', method:['GET'], schema:{querystring:Callback},
    handler: async(req, rep) => {
      logger.debug('cookies recieved: '+JSON.stringify(req.cookies));
      if(req.cookies&&Object.keys(req.cookies).includes(server.config.PATIENT_ID_COOKIE)&&req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).valid) {
        if(req.query.access_token&&req.query.access_secret) {
          logger.debug('received info for user. updating db...');
          try {
            const {Garmin} = server.db.models;
            await Garmin.updateOne({'_id':'u'+req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).value||undefined}, {'access_token':req.query.access_token, 'access_secret':req.query.access_secret}, {upsert:true}); 
            logger.debug('db updated.');
          } catch(error) { 
            logger.error('error updating garmin credentials: '+error); 
          }
        } 
        rep.view('callback.pug');
      } else {
        rep.code(500).send('problem connecting provider');
      }
      
    }
  });

};
