import { Static, Type } from '@sinclair/typebox'

export const VendorId = Type.Object({vendorId:Type.String()});
export type VendorIdType = Static<typeof VendorId>;
export const PatientId = Type.Object({patientId:Type.String()});
export type PatientIdType = Static<typeof PatientId>;
