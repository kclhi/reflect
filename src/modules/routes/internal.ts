import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { PatientId, PatientIdType, VendorId, VendorIdType } from '../types/types';
import { Token, TokenResponseBody, TokenType } from '../types/withings';
import { WithingsDocument } from '../db/models/withings';
import WithingsUtils from '../lib/withings';
import { GarminDocument } from '../db/models/garmin';

export default async(server:FastifyInstance) => {

  server.addHook('onRequest', process.env.NODE_ENV&&process.env.NODE_ENV=="test"?(_req:any, _rep:any, done:any)=>{done()}:server.basicAuth);
  
  server.route<{Body:VendorIdType, Reply:PatientIdType}>({
    url:'/id/withings', method:['POST'], schema:{body:VendorId, response:{200:PatientId}},
    handler: async(req, rep) => {
      const {body:withings} = req;
      const {Withings} = server.db.models;
      let users:Array<WithingsDocument> = [];
      logger.debug('about to extract id of patient...');
      try { 
        users = await Withings.find({'_id':{$ne:undefined}, 'withingsId':withings.vendorId});
      } catch(error) { 
        logger.error('error getting withings credentials: '+error); 
      }
      logger.debug('extracted '+users.length+' records with this id.');
      rep.code(200).send(users.length?{'patientId':users[0]._id}:{'patientId':''});
    }
  });

  server.route<{Body:VendorIdType, Reply:TokenType}>({
    url:'/token', method:['POST'], schema:{body:VendorId, response:{200:Token}},
    handler: async(req, rep) => {
      const {body:withings} = req;
      // get user from supplied withings id
      const {Withings} = server.db.models;
      let user:WithingsDocument|null = null;
      try { 
        user = await Withings.findOne({'_id':{$ne:undefined}, 'withingsId':withings.vendorId});
        logger.debug('got credentials.')
      } catch(error) { 
        logger.error('error getting withings credentials: '+error); 
      }
      logger.debug(user?'extracted user':'did not extract user');
      if(!user) return rep.code(200).send({'token':''});
      // ~mdc access token is short lived, so just refresh
      let access:TokenResponseBody|undefined = await WithingsUtils.refreshAccessToken(server.config.WITHINGS_TOKEN_URL, server.config.WITHINGS_CLIENT_ID, server.config.WITHINGS_CONSUMER_SECRET, user?.refresh);
      if(!access) return rep.code(200).send({'token':''});
      // update user with new access token
      try {
        await Withings.updateOne({'withingsId':user.withingsId}, {'token':access.access_token, 'refresh':access.refresh_token}, {upsert:true});
        logger.debug('db updated.');
      } catch(error) {
        logger.error('eror updating access token: '+error);
      }
      // return token
      return rep.code(200).send(user?.token?{'token':access.access_token}:{'token':''});
    }
  });

  server.route<{Body:VendorIdType, Reply:PatientIdType}>({
    url:'/id/garmin', method:['POST'], schema:{body:VendorId, response:{200:PatientId}},
    handler: async(req, rep) => {
      const {body:garmin} = req;
      const {Garmin} = server.db.models;
      let users:Array<GarminDocument> = [];
      logger.debug('about to extract id of patient...');
      try { 
        users = await Garmin.find({'_id':{$ne:undefined}, 'access_token':garmin.vendorId});
      } catch(error) { 
        logger.error('error getting garmin credentials: '+error); 
      }
      logger.debug('extracted '+users.length+' records with this id.');
      rep.code(200).send(users.length?{'patientId':users[0]._id}:{'patientId':''});
    }
  });

};
