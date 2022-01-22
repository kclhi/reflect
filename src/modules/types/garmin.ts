import {Static, Type} from '@sinclair/typebox';

export const Callback = Type.Object({access_token: Type.String(), access_secret: Type.String()});
export type CallbackType = Static<typeof Callback>;
