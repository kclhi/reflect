import fastify from 'fastify'
import {FastifyCookieOptions} from 'fastify-cookie'
import fastifyBasicAuth, { FastifyBasicAuthOptions } from 'fastify-basic-auth';
import fastifyPointOfView from 'point-of-view';
import fastifyEnv from 'fastify-env'
import cookie from 'fastify-cookie'
import fastifyStatic from 'fastify-static';
import pug from 'pug';
import {join} from 'path';
import merge from 'lodash.merge';
import logger from 'winston';

import nokia from './modules/routes/nokia';
import internal from './modules/routes/internal';
import connect from './modules/db/index';
import {Db} from './modules/db/index';
import Config from './config/config';

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT:string, 
      COOKIE_SECRET:string, 
      PATIENT_ID_COOKIE:string,
      DB_STRING:string, 
      DB_USER:string, 
      DB_PASS:string, 
      DB_PASS_PATH:string, 
      ROOT_CERT_PATH:string, 
      USER:string, 
      PASSWORD:string, 
      NOKIA_CLIENT_ID:string,
      NOKIA_CONSUMER_SECRET:string,
      NOKIA_AUTHORISATION_URL:string, 
      NOKIA_CALLBACK_BASE_URL:string, 
      NOKIA_TOKEN_URL:string,
      NOKIA_SUBSCRIPTION_URL:string,
      API_URL:string
    },
    db:Db;
  }
}

export default async() => {
  
  const app = fastify({logger:true});

  // config
  let config:Config = process.env.NODE_ENV=="production"?merge(require('./config/config.json'), require('./config/production.config.json')):merge(require('./config/config.json'), require('./config/development.config.json'));

  // env
  await app.register(fastifyEnv, {dotenv:true, schema:{type:'object', properties:{
    PORT:{type:'string', default:3000}, 
    COOKIE_SECRET:{type:'string', default:'secret'}, 
    PATIENT_ID_COOKIE:{type:'string'},
    DB_STRING:{type:'string', default:''},
    DB_USER:{type:'string', default:''}, 
    DB_PASS:{type:'string', default:''},
    DB_PASS_PATH:{type:'string', default:''},
    ROOT_CERT_PATH: {type:'string', default:''},
    USER:{type:'string', default:'user'},
    PASSWORD:{type:'string', default:'pass'},
    NOKIA_CLIENT_ID:{type:'string', default:''},
    NOKIA_CONSUMER_SECRET:{type:'string', default:''},
    NOKIA_AUTHORISATION_URL:{type:'string', default:config.NOKIA.AUTHORISATION_URL},
    NOKIA_CALLBACK_BASE_URL:{type:'string', default:config.NOKIA.CALLBACK_BASE_URL},
    NOKIA_TOKEN_URL:{type:'string', default:config.NOKIA.TOKEN_URL},
    NOKIA_SUBSCRIPTION_URL:{type:'string', default:config.NOKIA.SUBSCRIPTION_URL},
    API_URL:{type:'string'}
  }}});

  // db
  await app.register(connect, {URL:app.config.DB_STRING, DB_USER:app.config.DB_USER, DB_PASS:app.config.DB_PASS, DB_PASS_PATH:app.config.DB_PASS_PATH, ROOT_CERT_PATH:app.config.ROOT_CERT_PATH});

  // auth
  const authenticate = {realm:'reflect'}
  const validate = async(username:string, password:string) => { if(username!==app.config.USER||password!==app.config.PASSWORD) { return new Error('access denied'); } else { return undefined; }};
  await app.register(fastifyBasicAuth, {authenticate, validate} as FastifyBasicAuthOptions);

  app.addHook('onRequest', process.env.NODE_ENV&&process.env.NODE_ENV=="test"?(_req:any, _rep:any, done:any)=>{done()}:app.basicAuth);

  app.setErrorHandler((err, _req, rep) => {
    if(err.statusCode===401) {
      rep.code(401).send('unauthorized');
      return;
    }
    rep.send(err);
  });
 
  // cookies
  app.register(cookie, {secret:app.config.COOKIE_SECRET} as FastifyCookieOptions);

  // views
  app.register(fastifyStatic, {root:join(__dirname, 'public'), prefix:'/assets/'});
  app.register(fastifyPointOfView, {engine:{pug:pug}, root:join(__dirname, 'views'),});

  // routes
  app.register(nokia, {prefix:'/nokia'});
  app.register(internal, {prefix:'/internal'});
  
  return app;

}

