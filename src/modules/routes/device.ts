import logger from '../../winston';
import { FastifyInstance } from 'fastify';
import * as crypto from 'crypto';
import { PatientId, PatientIdType } from '../types/withings'

export default async(server:FastifyInstance) => {

  server.route({url:'/register', method:['GET'], handler:(_req, rep)=>{
    const callback = server.config.WITHINGS_CALLBACK_BASE_URL+'/withings/callback';
    const state = crypto.randomBytes(16);
    const redirectUrl = server.config.WITHINGS_AUTHORISATION_URL+'?response_type=code&redirect_uri='+callback+'&client_id='+server.config.WITHINGS_CLIENT_ID+'&scope=user.info,user.metrics,user.activity&state='+state.toString('hex');
    rep.view('register.pug', {withingsRedirectUrl:redirectUrl});
  }});

  server.route<{Body:PatientIdType}>({url:'/setIdCookie', method:['POST'], schema:{body:PatientId}, handler:(req, rep)=>{
    rep.setCookie(server.config.PATIENT_ID_COOKIE, req.body.patientId, {path:'/', httpOnly:true, secure:true, signed:true}).send()
  }});

};
