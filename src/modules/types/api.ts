import { Static, Type } from '@sinclair/typebox'

export const PatientId = Type.Object({patientId:Type.String()});
export type PatientIdType = Static<typeof PatientId>;
export const FHIRResource = Type.Object({resource:Type.String()});
export type FHIRResourceType = Static<typeof FHIRResource>;
