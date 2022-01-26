import {Static, Type} from '@sinclair/typebox';

export const Credentials = Type.Object({username: Type.String(), password: Type.String()});
export type CredentialsType = Static<typeof Credentials>;
export const JWT = Type.Object({token: Type.String()});
export type JWTType = Static<typeof JWT>;
export const PatientId = Type.Object({patientId: Type.String()});
export type PatientIdType = Static<typeof PatientId>;
export const FHIRResource = Type.Object({resource: Type.Any()});
export type FHIRResourceType = Static<typeof FHIRResource>;
