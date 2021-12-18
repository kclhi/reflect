import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import * as crypto from 'crypto';
import { Callback, CallbackType, NokiaId, NokiaIdType, PatientId, PatientIdType, TokenResponseBody } from '../types/nokia'
import { NokiaDocument } from '../db/models/nokia';
import Nokia from '../lib/nokia';

export default async(server:FastifyInstance) => {

  server.route({url:'/register', method:['GET'], handler:(_req, rep)=>{
    const callback = server.config.NOKIA_CALLBACK_BASE_URL+'/nokia/callback';
    const state = crypto.randomBytes(16);
    const redirectUrl = server.config.NOKIA_AUTHORISATION_URL+'?response_type=code&redirect_uri='+callback+'&client_id='+server.config.NOKIA_CLIENT_ID+'&scope=user.info,user.metrics,user.activity&state='+state.toString('hex');
    rep.view('register.pug', {nokiaRedirectUrl:redirectUrl});
  }});

  server.route<{Querystring:CallbackType}>({
    url: '/callback', method:['GET', 'HEAD'], schema:{querystring:Callback},
    handler: async(req, rep) => {
      logger.debug('cookies recieved: '+JSON.stringify(req.cookies));
      if(req.cookies&&Object.keys(req.cookies).includes(server.config.PATIENT_ID_COOKIE)&&req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).valid) {
        let access:TokenResponseBody|undefined = await Nokia.getAccessToken(server.config.NOKIA_TOKEN_URL, server.config.NOKIA_CLIENT_ID, server.config.NOKIA_CONSUMER_SECRET, server.config.NOKIA_CALLBACK_BASE_URL, req.query.code);
        if(access) {
          logger.debug('received info for user. updating db...');
          try {
            const {Nokia} = server.db.models;
            await Nokia.updateOne({'_id':req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).value||undefined}, {'nokiaId':access.userid, 'token':access.access_token, 'refresh':access.refresh_token}, {upsert:true}); 
            logger.debug('db updated.');
          } catch(error) { 
            logger.error('error updating nokia credentials: '+error); 
          }
          try {
            let subscribed:boolean = await Nokia.subscribeToNotifications(server.config.NOKIA_SUBSCRIPTION_URL, access.access_token, access.userid, server.config.API_URL);
            logger.debug(subscribed?"subscribed to notifications":"unable to subscribe to notifications");
          } catch(error) {
            logger.error('error subscribing to notification:'+error);
          }
        } 
      }
      rep.code(200).send();
    }
  });

  server.route<{Body:NokiaIdType, Reply:PatientIdType}>({
    url: '/id', method:['POST'], schema:{body:NokiaId, response:{200:PatientId}},
    handler: async(req, rep) => {
      const {body:nokia} = req;
      const {Nokia} = server.db.models;
      let users:Array<NokiaDocument> = [];
      try { 
        users = await Nokia.find({'_id':{$ne:undefined}, 'nokiaId':nokia.nokiaId});
      } catch(error) { 
        logger.error('error getting withings credentials: '+error); 
      }
      logger.debug('extracted '+users.length+' records with this id.');
      rep.code(200).send(users.length?{'patientId':users[0]._id}:{'patientId':''});
    }
  });
  
  server.route<{Body:PatientIdType}>({url:'/setIdCookie', method:['POST'], schema:{body:PatientId}, handler:(req, rep)=>{
    rep.setCookie(server.config.PATIENT_ID_COOKIE, req.body.patientId, {path:'/', httpOnly:true, secure:true, signed:true}).send()
  }});

};
