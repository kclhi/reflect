import { Schema, Model, model, Document } from 'mongoose'

export interface NokiaDocument extends Document {_id:string, nokiaId:string, token:string, refresh:string}
export const NokiaModel:Model<NokiaDocument> = model<NokiaDocument>('nokia', new Schema<NokiaDocument>({_id:{type:String, required:true}, nokiaId:{type:String, required:true}, token:{type:String, required:true}, refresh:{type:String, required:true}}));
