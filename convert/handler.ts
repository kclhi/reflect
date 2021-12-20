import { ContextPayload, EventPayload, BloodPressureReading } from './types';
import winston from 'winston';
import fhir from './lib/fhir';
import { Observation, Patient } from 'fhir-typescript-models';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({level:'info', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  let bloodPresureReading:BloodPressureReading = event.body as BloodPressureReading;

  let patientFhirResource:Patient = fhir.createPatientResource(bloodPresureReading.identifier, bloodPresureReading.subject);
  logger.debug(patientFhirResource.toJSON());
  try {
    let addPatient:boolean = await fhir.addResourceToFHIRServer(process.env.internal_api_url, bloodPresureReading.identifier, patientFhirResource);
    if(!addPatient) logger.warn('patient resource already exists');
  } catch(error) {
    logger.error('unable to add patient resource to server: '+error);
  }

  let observationFhirResource:Observation = fhir.createBpResource(bloodPresureReading.subject, bloodPresureReading.sbp, bloodPresureReading.dbp, bloodPresureReading.hr);
  logger.debug(observationFhirResource.toJSON());
  try {
    let addObservation:boolean = await fhir.addResourceToFHIRServer(process.env.internal_api_url, null, observationFhirResource);
  } catch(error) {
    logger.error('unable to add observation resource to server: '+error);
  }

  return context.code(200).send({});
};
