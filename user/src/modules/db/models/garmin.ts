import {Schema, Model, model, Document} from 'mongoose';

export interface GarminDocument extends Document {
  _id:string;
  access_token:string;
  access_secret:string;
}
export const GarminModel:Model<GarminDocument> = model<GarminDocument>(
  'garmin',
  new Schema<GarminDocument>({
    _id: {type: String, required: true},
    access_token: {type: String, required: true},
    access_secret: {type: String, required: true}
  })
);
