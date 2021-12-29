import { Static, Type } from '@sinclair/typebox'

export const Callback = Type.Object({code:Type.String(), state:Type.String()});
export type CallbackType = Static<typeof Callback>;

export const WithingsId = Type.Object({withingsId:Type.String()});
export type WithingsIdType = Static<typeof WithingsId>;
export const PatientId = Type.Object({patientId:Type.String()});
export type PatientIdType = Static<typeof PatientId>;
export const Token = Type.Object({token:Type.String()});
export type TokenType = Static<typeof Token>;

export interface TokenResponseBody { access_token:string, expires_in:number, token_type:string, scope:string, refresh_token:string, userid:string };
export interface NotificationSubscription { action:string, user_id:string, callbackurl:string, comment:string, appli:number }
