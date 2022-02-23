import {Static, Type} from '@sinclair/typebox';

export const VendorId = Type.Object({vendorId: Type.String()});
export type VendorIdType = Static<typeof VendorId>;
export const PatientId = Type.Object({patientId: Type.String()});
export type PatientIdType = Static<typeof PatientId>;
export const Registration = Type.Object({patientId: Type.String(), partner: Type.String()})
export type RegistrationType = Static<typeof Registration>;
