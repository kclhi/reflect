import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { WithingsId, WithingsIdType, PatientId, PatientIdType, Token, TokenResponseBody, TokenType } from '../types/withings';
import { WithingsDocument } from '../db/models/withings';
import WithingsUtils from '../lib/withings';

export default async(server:FastifyInstance) => {

  server.route<{Body:WithingsIdType, Reply:PatientIdType}>({
    url:'/id', method:['POST'], schema:{body:WithingsId, response:{200:PatientId}},
    handler: async(req, rep) => {
      const {body:withings} = req;
      const {Withings} = server.db.models;
      let users:Array<WithingsDocument> = [];
      logger.debug('about to extract id of patient...');
      try { 
        users = await Withings.find({'_id':{$ne:undefined}, 'withingsId':withings.withingsId});
      } catch(error) { 
        logger.error('error getting withings credentials: '+error); 
      }
      logger.debug('extracted '+users.length+' records with this id.');
      rep.code(200).send(users.length?{'patientId':users[0]._id}:{'patientId':''});
    }
  });

  server.route<{Body:WithingsIdType, Reply:TokenType}>({
    url:'/token', method:['POST'], schema:{body:WithingsId, response:{200:Token}},
    handler: async(req, rep) => {
      const {body:withings} = req;
      // get user from supplied withings id
      const {Withings} = server.db.models;
      let user:WithingsDocument|null = null;
      try { 
        user = await Withings.findOne({'_id':{$ne:undefined}, 'withingsId':withings.withingsId});
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

};
