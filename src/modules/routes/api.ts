import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import { FHIRResource, FHIRResourceType, PatientId, PatientIdType } from '../types/api';
import got, { Response } from 'got';

export default async(server:FastifyInstance) => {

  server.addHook('onRequest', process.env.NODE_ENV&&process.env.NODE_ENV=="test"?(_req:any, _rep:any, done:any)=>{done()}:async(req, rep) => { try { await req.jwtVerify() } catch(error) { rep.send(error) }});

  server.route<{Body:PatientIdType, Reply:FHIRResourceType}>({url:'/fhir', method:['POST'], schema:{description:'Collect all the data available on a patient. Formatted as FHIR.', body:PatientId, response:{200:FHIRResource}, security:[{bearerAuth:[]}]}, handler:async(req, rep)=>{
    let getFHIR:Response<string>|undefined;
    try {
      getFHIR = await got.get('https://'+server.config.INTERNAL_API_URL+'/fhir/Observation?subject='+req.body.patientId);
      if(getFHIR.statusCode!=200) throw Error('fhir server returned status: '+getFHIR.statusCode);
      logger.debug('internal fhir request response: '+getFHIR.body);
    } catch(error) {
      logger.error('error contacting fhir server: '+error);
    }
    rep.code(200).send({'resource':getFHIR?.body||''}); 
  }});

};
