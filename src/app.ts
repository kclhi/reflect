import fastify from 'fastify'
import {FastifyCookieOptions} from 'fastify-cookie'
import fastifyBasicAuth, { FastifyBasicAuthOptions } from 'fastify-basic-auth';
import fastifyPointOfView from 'point-of-view';
import fastifyEnv from 'fastify-env'
import cookie from 'fastify-cookie'
import fastifyStatic from 'fastify-static';
import fastifySession from 'fastify-session';
import fastifyGrant from 'fastify-grant';
import pug from 'pug';
import {join} from 'path';
import merge from 'lodash.merge';
import logger from './winston';

import device from './modules/routes/device';
import withings from './modules/routes/withings';
import garmin from './modules/routes/garmin';
import garminExternal from './modules/routes/garmin-external';
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
      DB_ROOT_CERT_PATH:string,
      API_URL:string,
      USER:string, 
      PASSWORD:string, 
      WITHINGS_CLIENT_ID:string,
      WITHINGS_CONSUMER_SECRET:string,
      WITHINGS_AUTHORISATION_URL:string, 
      WITHINGS_CALLBACK_BASE_URL:string, 
      WITHINGS_TOKEN_URL:string,
      WITHINGS_SUBSCRIPTION_URL:string,
      GARMIN_BASE_URL:string,
      GARMIN_KEY:string,
      GARMIN_SECRET:string
    },
    db:Db;
  }
}

export default async() => {
  
  const app = fastify({logger:true});

  // config
  let config:Config;
  switch(process.env.NODE_ENV) {
    case 'production':
      config=merge(require('./config/config.json'), require('./config/production.config.json'));
      break;
    case 'staging':
      config=merge(require('./config/config.json'), require('./config/staging.config.json'));
      break;
    default:
      config=merge(require('./config/config.json'), require('./config/development.config.json'));
  }

  // env
  await app.register(fastifyEnv, {dotenv:true, schema:{type:'object', properties:{
    PORT:{type:'string', default:3000}, 
    COOKIE_SECRET:{type:'string', default:'UJNtVgKkndwYRwth7Jf2kHNY6nmIJLac'}, 
    PATIENT_ID_COOKIE:{type:'string', default:'patientId'},
    DB_STRING:{type:'string', default:''},
    DB_USER:{type:'string', default:''}, 
    DB_PASS:{type:'string', default:''},
    DB_PASS_PATH:{type:'string', default:''},
    DB_ROOT_CERT_PATH:{type:'string', default:''},
    API_URL:{type:'string'},
    USER:{type:'string', default:'user'},
    PASSWORD:{type:'string', default:'pass'},
    WITHINGS_CLIENT_ID:{type:'string', default:''},
    WITHINGS_CONSUMER_SECRET:{type:'string', default:''},
    WITHINGS_AUTHORISATION_URL:{type:'string', default:config.WITHINGS.AUTHORISATION_URL},
    WITHINGS_CALLBACK_BASE_URL:{type:'string', default:config.WITHINGS.CALLBACK_BASE_URL},
    WITHINGS_TOKEN_URL:{type:'string', default:config.WITHINGS.TOKEN_URL},
    WITHINGS_SUBSCRIPTION_URL:{type:'string', default:config.WITHINGS.SUBSCRIPTION_URL},
    GARMIN_BASE_URL:{type:'string', default:config.GARMIN.BASE_URL},
    GARMIN_KEY:{type:'string', default:''},
    GARMIN_SECRET:{type:'string', default:''}
  }}});
  logger.debug('config: '+JSON.stringify(app.config));

  // db
  await app.register(connect, {URL:app.config.DB_STRING, DB_USER:app.config.DB_USER, DB_PASS:app.config.DB_PASS, DB_PASS_PATH:app.config.DB_PASS_PATH, DB_ROOT_CERT_PATH:app.config.DB_ROOT_CERT_PATH});

  // auth
  const authenticate = {realm:'reflect'};
  const validate = async(username:string, password:string) => { if(username!==app.config.USER||password!==app.config.PASSWORD) { return new Error('access denied'); } else { return undefined; }};
  await app.register(fastifyBasicAuth, {authenticate, validate} as FastifyBasicAuthOptions);

  app.setErrorHandler((err, _req, rep) => { if(err.statusCode===401) { rep.code(401).send('unauthorized'); return; } rep.send(err); });
 
  // cookies
  app.register(cookie, {secret:app.config.COOKIE_SECRET} as FastifyCookieOptions);

  // views
  app.register(fastifyStatic, {root:join(__dirname, 'public'), prefix:'/device/assets/'});
  app.register(fastifyPointOfView, {engine:{pug:pug}, root:join(__dirname, 'views'),});

  // garmin plugin registration
  await app.register(fastifySession, {secret:app.config.COOKIE_SECRET, cookie:{secure:false}});
  await app.register(fastifyGrant({
    "defaults": {
      "origin": app.config.GARMIN_BASE_URL,
    },
    "garmin": {
      "oauth": 1,
      "key": app.config.GARMIN_KEY,
      "secret": app.config.GARMIN_SECRET,
      "scope": ["read", "write"],
      "callback": "/connect/garmin/done"
    }
  }));

  // routes
  app.register(device, {prefix:'/device'});
  app.register(withings, {prefix:'/withings'});
  app.register(garmin, {prefix:'/connect/garmin'});
  app.register(garminExternal, {prefix:'/connect/garmin'});
  app.register(internal, {prefix:'/internal'});
  
  return app;

}

