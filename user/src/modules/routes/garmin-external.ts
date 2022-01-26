import {FastifyInstance} from 'fastify';

export default async(server:FastifyInstance) => {
  server.route({
    url: '/dereg',
    method: ['POST'],
    schema: {},
    handler: async(req, rep) => {
      rep.code(200).send({});
    }
  });

  server.route({
    url: '/perms',
    method: ['POST'],
    schema: {},
    handler: async(req, rep) => {
      rep.code(200).send({});
    }
  });
};
