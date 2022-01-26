import {Schema, Model, model, Document} from 'mongoose';

export interface WithingsDocument extends Document {
  _id:string;
  withingsId:string;
  token:string;
  refresh:string;
}
export const WithingsModel:Model<WithingsDocument> = model<WithingsDocument>(
  'withings',
  new Schema<WithingsDocument>({
    _id: {type: String, required: true},
    withingsId: {type: String, required: true},
    token: {type: String, required: true},
    refresh: {type: String, required: true}
  })
);
