import {
  Observation,
  CodeableConcept,
  ObservationStatus,
  Coding,
  PrimitiveUri,
  PrimitiveCode,
  PrimitiveString,
  Reference,
  Patient,
  Identifier,
  PrimitiveDateTime,
  ObservationComponent,
  Quantity,
  PrimitiveDecimal,
  DomainResource
} from 'fhir-typescript-models';
import got, {Response} from 'got';

export default class Fhir {
  static createCode(system:string, value:string, display:string):Coding {
    const code:Coding = new Coding();
    const systemUri:PrimitiveUri = new PrimitiveUri();
    const valueCode:PrimitiveCode = new PrimitiveCode();
    const displayString:PrimitiveString = new PrimitiveString();
    systemUri.value = system;
    valueCode.value = value;
    displayString.value = display;
    code.system = systemUri;
    code.code = valueCode;
    code.display = displayString;
    return code;
  }

  static createQuantity(value:number, unit:string):Quantity {
    const quantity = new Quantity();
    const quantityValue = new PrimitiveDecimal();
    const quantitySystem = new PrimitiveUri();
    const quantityUnit = new PrimitiveString();
    const quantityCode = new PrimitiveCode();
    quantityValue.value = value;
    quantitySystem.value = 'http://unitsofmeasure.org';
    quantityUnit.value = unit;
    quantityCode.value = unit;
    quantity.value = quantityValue;
    quantity.system = quantitySystem;
    quantity.unit = quantityUnit;
    quantity.code = quantityCode;
    return quantity;
  }

  static createMeasure(
    codeSystem:string,
    codeValue:string,
    codeDisplay:string,
    value:number,
    unit:string
  ):ObservationComponent {
    const measure = new ObservationComponent();
    const measureCode = new CodeableConcept();
    measureCode.coding = new Array<Coding>(Fhir.createCode(codeSystem, codeValue, codeDisplay));
    measure.code = measureCode;
    measure.value = Fhir.createQuantity(value, unit);
    return measure;
  }

  static createBpResource(
    subject:string,
    sbp:number,
    dbp:number,
    hr:number,
    id:string = null,
    date:string = null
  ):Observation {
    return this.createObservationResource(
      subject,
      'https://loinc.org',
      '85354-9',
      'Blood pressure panel with all children optional',
      new Array<ObservationComponent>(
        this.createMeasure('http://loinc.org', '8480-6', 'Systolic blood pressure', sbp, 'mmHg'),
        this.createMeasure('http://loinc.org', '8462-4', 'Diastolic blood pressure', dbp, 'mmHg'),
        this.createMeasure('http://loinc.org', '8867-4', 'Heart rate', hr, 'beats/minute')
      ),
      id,
      date
    );
  }

  static createHrResource(
    subject:string,
    resting:number,
    rate:number,
    intensity:number,
    id:string = null,
    date:string = null
  ):Observation {
    return this.createObservationResource(
      subject,
      'https://loinc.org',
      '8867-4',
      'Heart rate',
      new Array<ObservationComponent>(
        this.createMeasure('http://loinc.org', '40443-4', 'Heart rate - resting', resting, 'beats/minute'),
        this.createMeasure('http://loinc.org', '8867-4', 'Heart rate', rate, 'beats/minute'),
        this.createMeasure('http://loinc.org', '82290-8', 'Freq aerobic physical activity', intensity, 'beats/minute')
      ),
      id,
      date
    );
  }

  static createObservationResource(
    subjectReferenceId:string,
    typeSystem:string,
    typeValue:string,
    typeDisplay:string,
    measures:Array<ObservationComponent>,
    id:string = null,
    date:string = null
  ):Observation {
    const observation:Observation = new Observation();
    /* id */
    if(id) observation.id = id;
    /* status */
    const status:ObservationStatus = new ObservationStatus();
    status.value = 'final';
    observation.status = status;
    /* category */
    const category = new CodeableConcept();
    const categories = new Array<CodeableConcept>(category);
    category.coding = new Array<Coding>(
      Fhir.createCode('http://terminology.hl7.org/CodeSystem/observation-category', 'vital-signs', '')
    );
    observation.category = categories;
    /* type (code) */
    const type = new CodeableConcept();
    type.coding = new Array<Coding>(Fhir.createCode(typeSystem, typeValue, typeDisplay));
    observation.code = type;
    /* subject */
    const subject:Reference = new Reference();
    const subjectReference = new PrimitiveString();
    subjectReference.value = 'Patient/' + subjectReferenceId;
    subject.reference = subjectReference;
    observation.subject = subject;
    /* time */
    const dateTime:PrimitiveDateTime = new PrimitiveDateTime();
    dateTime.value = date ? new Date(date).toISOString() : new Date().toISOString();
    observation.effective = dateTime;
    /* measures (components) */
    observation.component = measures;
    return observation;
  }

  static createPatientResource(id:string, subject:string):Patient {
    const patient:Patient = new Patient();
    patient.id = id;
    /* identifier */
    const identifier = new Identifier();
    const typeCoding = new CodeableConcept();
    const valueString = new PrimitiveString();
    typeCoding.coding = new Array<Coding>(
      Fhir.createCode('http://terminology.hl7.org/CodeSystem/v2-0203', 'NH', 'UK National Health Service number')
    );
    identifier.type = typeCoding;
    valueString.value = subject;
    identifier.value = valueString;
    patient.identifier = new Array<Identifier>(identifier);
    return patient;
  }

  static async addResourceToFHIRServer(baseUrl:string, id:string = null, resource:DomainResource):Promise<boolean> {
    try {
      const url = 'https://' + baseUrl + '/fhir/' + resource.getTypeName() + (id ? '/' + id : '');
      let addResource:Response;
      if(id) {
        addResource = await got.put(url, {
          headers: {'Content-Type': 'application/fhir+json'},
          json: resource.toJSON(),
          searchParams: {_format: 'json'}
        });
      } else {
        addResource = await got.post(url, {
          headers: {'Content-Type': 'application/fhir+json'},
          json: resource.toJSON(),
          searchParams: {_format: 'json'}
        });
      }
      if(addResource.statusCode != 201 && addResource.statusCode != 200)
        throw new Error('status: ' + addResource.statusCode);
      return addResource.statusCode == 201 ? true : false;
    } catch(error) {
      throw new Error('error contacting fhir server ' + error);
    }
  }
}
