import got, { Response } from 'got';
import { TokenResponseBody, NotificationSubscription } from '../types/withings'
import logger from '../../winston';

export default class Withings {

  static async getAccessToken(tokenUrl:string, clientId:string, consumerSecret:string, callbackBaseUrl:string, code:string):Promise<TokenResponseBody|undefined> {
    try {
      logger.debug('sending request for access token...')
      let access:Response<TokenResponseBody> = await got.post(tokenUrl, {form:{
        'grant_type': 'authorization_code',
        'client_id': clientId,
        'client_secret': consumerSecret,
        'code': code,
        'redirect_uri': callbackBaseUrl+'/withings/callback'
      }, responseType:'json'});
      logger.debug('response from access token request: '+access?.statusCode);
      if(access.statusCode==200) return access.body;
    } catch(error) {
      logger.error('error getting access token: '+error);
    }
    return undefined;
  }

  static async refreshAccessToken(tokenUrl:string, clientId:string, consumerSecret:string, refreshToken:string):Promise<TokenResponseBody|undefined> {
    logger.debug('refreshing access token...');
    try {
      let access:Response<TokenResponseBody> = await got.post(tokenUrl, {form:{
        'grant_type': 'refresh_token',
        'client_id': clientId,
        'client_secret': consumerSecret,
        'refresh_token': refreshToken
      }, responseType:'json'});
      logger.debug('response from access token request: '+access?.statusCode);
      if(access.statusCode==200) return access.body;
    } catch(error) {
      logger.error('error refreshing access token: '+error);
    }
    return undefined;
  }

  static genQueryString(params:any):string {
		let query_string:string="";
		for(let param in params) {
      if(['action', 'user_id', 'callbackurl', 'comment', 'appli', 'start', 'end', 'type', 'userid', 'date'].filter((nonOauthParam)=>param.includes(nonOauthParam)).length) query_string+=param+"="+params[param]+"&";
      else query_string+="oauth_"+param+"="+params[param]+"&";
		}
		return query_string.substring(0, query_string.length-1);
	}

  static async subscribeToNotifications(subscriptionUrl:string, token:string, userId:string, notifyBaseUrl:string):Promise<boolean> {
    let subscriptionParams:NotificationSubscription = {action:'subscribe', user_id:userId, callbackurl:encodeURIComponent(notifyBaseUrl+'/function/notify'), comment:'comment', appli:4};
    try {
      let fullSubscriptionUrl:string = subscriptionUrl+"?access_token="+token+"&"+this.genQueryString(subscriptionParams);
      logger.debug('subscription url: '+fullSubscriptionUrl);
      let subscribe:Response = await got.get(fullSubscriptionUrl);
      logger.debug('status from subscribe: '+subscribe.statusCode);
      if(subscribe.statusCode!=200) throw new Error('unable to subscribe to notifications '+subscribe.statusCode+' '+subscribe.body);
    } catch(error) {
      logger.error('error setting up subscription: '+error);
      return false;
    }
    return true;
  }

}
