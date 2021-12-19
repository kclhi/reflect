import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { NokiaId, NokiaIdType, PatientId, PatientIdType, Token, TokenResponseBody, TokenType } from '../types/nokia';
import { NokiaDocument } from '../db/models/nokia';
import NokiaUtils from '../lib/nokia';

export default async(server:FastifyInstance) => {

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

  server.route<{Body:NokiaIdType, Reply:TokenType}>({
    url: '/token', method:['POST'], schema:{body:NokiaId, response:{200:Token}},
    handler: async(req, rep) => {
      const {body:nokia} = req;
      // get user from supplied nokia id
      const {Nokia} = server.db.models;
      let user:NokiaDocument|null = null;
      try { 
        user = await Nokia.findOne({'_id':{$ne:undefined}, 'nokiaId':nokia.nokiaId});
        logger.debug('got credentials.')
      } catch(error) { 
        logger.error('error getting withings credentials: '+error); 
      }
      logger.debug(user?'extracted user':'did not extract user');
      if(!user) return rep.code(200).send({'token':''});
      // ~mdc access token is short lived, so just refresh
      let access:TokenResponseBody|undefined = await NokiaUtils.refreshAccessToken(server.config.NOKIA_TOKEN_URL, server.config.NOKIA_CLIENT_ID, server.config.NOKIA_CONSUMER_SECRET, user?.refresh);
      if(!access) return rep.code(200).send({'token':''});
      // update user with new access token
      try {
        await Nokia.updateOne({'nokiaId':user.nokiaId}, {'token':access.access_token, 'refresh':access.refresh_token}, {upsert:true});
        logger.debug('db updated.');
      } catch(error) {
        logger.error('eror updating access token: '+error);
      }
      // return token
      return rep.code(200).send(user?.token?{'token':access.access_token}:{'token':''});
    }
  });

};
