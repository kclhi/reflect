import logger from '../../winston';
import {FastifyInstance} from 'fastify';
import {Callback, CallbackType, TokenResponseBody} from '../types/withings';
import Withings from '../lib/withings';

export default async(server:FastifyInstance) => {
  server.addHook(
    'onRequest',
    process.env.NODE_ENV && process.env.NODE_ENV == 'test'
      ? (_req:any, _rep:any, done:any) => {
          done();
        }
      : server.basicAuth
  );

  server.route<{Querystring:CallbackType}>({
    url: '/callback',
    method: ['GET', 'HEAD'],
    schema: {querystring: Callback},
    handler: async(req, rep) => {
      logger.debug('cookies recieved: ' + JSON.stringify(req.cookies));
      if(
        req.cookies &&
        Object.keys(req.cookies).includes(server.config.PATIENT_ID_COOKIE) &&
        req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).valid
      ) {
        const access:TokenResponseBody | undefined = await Withings.getAccessToken(
          server.config.WITHINGS_TOKEN_URL,
          server.config.WITHINGS_CLIENT_ID,
          server.config.WITHINGS_CONSUMER_SECRET,
          server.config.WITHINGS_CALLBACK_BASE_URL,
          req.query.code
        );
        if(access) {
          logger.debug('received info for user. updating db...');
          try {
            const {Withings} = server.db.models;
            await Withings.updateOne(
              {_id: 'u' + req.unsignCookie(req.cookies[server.config.PATIENT_ID_COOKIE]).value || undefined},
              {withingsId: access.userid, token: access.access_token, refresh: access.refresh_token},
              {upsert: true}
            );
            logger.debug('db updated.');
          } catch(error) {
            logger.error('error updating withings credentials: ' + error);
          }
          try {
            const subscribed:boolean = await Withings.subscribeToNotifications(
              server.config.WITHINGS_SUBSCRIPTION_URL,
              access.access_token,
              access.userid,
              server.config.API_URL
            );
            logger.debug(subscribed ? 'subscribed to notifications' : 'unable to subscribe to notifications');
          } catch(error) {
            logger.error('error subscribing to notification:' + error);
          }
        }
      }
      rep.view('callback.pug');
    }
  });
};
