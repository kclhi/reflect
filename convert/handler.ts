import { ContextPayload, EventPayload, BloodPressureReading, Reading } from './types';
import winston from 'winston';
import fhir from './lib/fhir';
import { Observation, Patient } from 'fhir-typescript-models';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({level:'info', format:winston.format.simple(), transports:[new winston.transports.Console({stderrLevels:['error']})]});
  let reading:Reading = event.body as Reading;

  let patientFhirResource:Patient = fhir.createPatientResource(reading.identifier, reading.subject);
  logger.debug(patientFhirResource.toJSON());
  try {
    let addPatient:boolean = await fhir.addResourceToFHIRServer(process.env.internal_api_url, reading.identifier, patientFhirResource);
    if(!addPatient) logger.warn('patient resource already exists');
  } catch(error) {
    logger.error('unable to add patient resource to server: '+error);
  }

  let bloodPresureReading = event.body as BloodPressureReading;
  if(bloodPresureReading.sbp&&bloodPresureReading.dbp&&bloodPresureReading.hr) {
    let observationFhirResource:Observation = fhir.createBpResource(bloodPresureReading.subject, bloodPresureReading.sbp, bloodPresureReading.dbp, bloodPresureReading.hr);
    logger.debug(observationFhirResource.toJSON());
    try {
      let addObservation:boolean = await fhir.addResourceToFHIRServer(process.env.internal_api_url, null, observationFhirResource);
    } catch(error) {
      logger.error('unable to add observation resource to server: '+error);
    }
  }

  return context.code(200).send({});
};
