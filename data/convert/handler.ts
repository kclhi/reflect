import {ContextPayload, EventPayload, BloodPressureReading, Reading, HeartRateReading} from './types';
import winston from 'winston';
import fhir from './lib/fhir';
import {Observation, Patient} from 'fhir-typescript-models';

export default async(event:EventPayload, context:ContextPayload):Promise<ContextPayload> => {
  const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.simple(),
    transports: [new winston.transports.Console({stderrLevels: ['error']})]
  });
  const reading:Reading = event.body as Reading;

  if(!event.body) {
    logger.debug('no request body, stopping...');
    return context.code(200).send('');
  }
  logger.debug('received data: ' + JSON.stringify(event.body));

  const patientFhirResource:Patient = fhir.createPatientResource(reading.subject, reading.subject);
  logger.debug(JSON.stringify(patientFhirResource.toJSON()));
  try {
    const addPatient:boolean = await fhir.addResourceToFHIRServer(
      process.env.INTERNAL_API_URL,
      reading.subject,
      patientFhirResource
    );
    if(!addPatient) logger.warn('patient resource already exists');
    logger.debug('added patient to server');
  } catch(error) {
    logger.error('unable to add patient resource to server: ' + error);
  }

  const bloodPresureReading:BloodPressureReading = event.body as BloodPressureReading;
  if(
    bloodPresureReading.sbp != undefined &&
    bloodPresureReading.dbp != undefined &&
    bloodPresureReading.hr != undefined
  ) {
    const bpObservationFhirResource:Observation = fhir.createBpResource(
      bloodPresureReading.subject,
      bloodPresureReading.sbp,
      bloodPresureReading.dbp,
      bloodPresureReading.hr
    );
    logger.debug(JSON.stringify(bpObservationFhirResource.toJSON()));
    try {
      const addBPObservation:boolean = await fhir.addResourceToFHIRServer(
        process.env.INTERNAL_API_URL,
        null,
        bpObservationFhirResource
      );
      logger.debug('added bp observation to server');
    } catch(error) {
      logger.error('unable to add blood pressure observation resource to server: ' + error);
    }
  }

  const heartRateReading:HeartRateReading = event.body as HeartRateReading;
  if(
    heartRateReading.resting != undefined &&
    heartRateReading.rate != undefined &&
    heartRateReading.intensity != undefined
  ) {
    heartRateReading.identifier = 'o' + heartRateReading.identifier.replaceAll('-', '');
    const hrObservationFhirResource:Observation = fhir.createHrResource(
      heartRateReading.subject,
      heartRateReading.resting,
      heartRateReading.rate,
      heartRateReading.intensity,
      heartRateReading.identifier
    );
    logger.debug(JSON.stringify(hrObservationFhirResource.toJSON()));
    try {
      // use garmin's identifer to avoid duplicate entries
      const addHRObservation:boolean = await fhir.addResourceToFHIRServer(
        process.env.INTERNAL_API_URL,
        heartRateReading.identifier,
        hrObservationFhirResource
      );
      logger.debug('added hr observation to server');
    } catch(error) {
      logger.error('unable to add heart rate observation resource to server: ' + error);
    }
  }

  return context.code(200).send({});
};
