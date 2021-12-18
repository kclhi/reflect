import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { NokiaId, NokiaIdType, PatientId, PatientIdType } from '../types/nokia';
import { NokiaDocument } from '../db/models/nokia';

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

};
