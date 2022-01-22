import fastify from 'fastify';
import fastifyEnv from 'fastify-env';
import fastifyJwt from 'fastify-jwt';
import fastifySwagger from 'fastify-swagger';
import merge from 'lodash.merge';
import {promises as fs} from 'fs';

import api from './modules/routes/api';
import Config from './config/config';
import {Credentials, CredentialsType, JWT, JWTType} from './modules/types/api';

declare module 'fastify' {
  interface FastifyInstance {
    config:{
      USER:string;
      PASSWORD:string;
      PORT:string;
      JWT_SECRET:string;
      INTERNAL_API_URL:string;
      SWAGGER_HOSTNAME:string;
    };
  }
}

export default async() => {
  const app = fastify({logger: true});

  // config
  let config:Config;
  switch (process.env.NODE_ENV) {
    case 'production':
      config = merge(
        JSON.parse(await fs.readFile(__dirname + '/config/config.json', 'utf8')),
        JSON.parse(await fs.readFile(__dirname + '/config/production.config.json', 'utf8'))
      );
      break;
    case 'staging':
      config = merge(
        JSON.parse(await fs.readFile(__dirname + '/config/config.json', 'utf8')),
        JSON.parse(await fs.readFile(__dirname + '/config/staging.config.json', 'utf8'))
      );
      break;
    default:
      config = merge(
        JSON.parse(await fs.readFile(__dirname + '/config/config.json', 'utf8')),
        JSON.parse(await fs.readFile(__dirname + '/config/development.config.json', 'utf8'))
      );
  }

  // env
  await app.register(fastifyEnv, {
    dotenv: true,
    schema: {
      type: 'object',
      properties: {
        USER: {type: 'string', default: 'user'},
        PASSWORD: {type: 'string', default: 'pass'},
        PORT: {type: 'string', default: 3000},
        JWT_SECRET: {type: 'string', default: 'secret'},
        INTERNAL_API_URL: {type: 'string', default: 'mocked'},
        SWAGGER_HOSTNAME: {type: 'string', default: config.SWAGGER.HOSTNAME}
      }
    }
  });

  // docs
  app.register(fastifySwagger, {
    routePrefix: '/docs',
    openapi: {
      info: {
        title: 'REFLECT API',
        version: '1.0.0',
        description: 'Test the endpoints offered by the REFLECT API'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    exposeRoute: true
  });

  // auth
  app.register(fastifyJwt, {secret: app.config.JWT_SECRET});
  app.route<{Body:CredentialsType; Reply:JWTType | string}>({
    url: '/login',
    method: ['POST'],
    schema: {body: Credentials, response: {200: JWT, 401: {type: 'string'}}},
    handler: async(req, rep) => {
      if(req.body.username === app.config.USER && req.body.password === app.config.PASSWORD) {
        const token = app.jwt.sign({});
        rep.send({token});
      } else {
        rep.status(401).send('unauthorised');
      }
    }
  });

  // routes
  app.register(api, {prefix: '/api'});

  return app;
};
