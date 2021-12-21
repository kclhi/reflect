import fastify from 'fastify'
import fastifyEnv from 'fastify-env'
import fastifyJwt from 'fastify-jwt'
import fastifySwagger from 'fastify-swagger'
import merge from 'lodash.merge';
import logger from './winston';

import api from './modules/routes/api';
import Config from './config/config';

declare module 'fastify' { interface FastifyInstance { config:{
  PORT:string, 
  JWT_SECRET:string,
  INTERNAL_API_URL:string
}} }

export default async() => {
  
  const app = fastify({logger:true});

  // config
  let config:Config = process.env.NODE_ENV=="production"?merge(require('./config/config.json'), require('./config/production.config.json')):merge(require('./config/config.json'), require('./config/development.config.json'));

  // env
  await app.register(fastifyEnv, {dotenv:true, schema:{type:'object', properties:{
    PORT:{type:'string', default:3000}, 
    JWT_SECRET:{type:'string', default:'secret'},
    INTERNAL_API_URL:{type:'string', default:''}
  }}});

  // auth
  app.register(fastifyJwt, {secret:app.config.JWT_SECRET});

  // docs
  app.register(fastifySwagger, {
    routePrefix: '/docs',
    swagger: {
      info: {
        title: 'Test swagger',
        description: 'Testing the Fastify swagger API',
        version: '0.1.0'
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here'
      },
      host: 'localhost',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true
  });

  // routes
  app.register(api, {prefix:'/api'});
  
  return app;

}

