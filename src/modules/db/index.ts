import { FastifyInstance } from 'fastify';
import { FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import { Model } from 'mongoose'
import { NokiaModel, NokiaDocument } from './models/nokia';
import logger from '../../winston'
import { promises as fs } from 'fs';

export interface Models { Nokia:Model<NokiaDocument>; }
export interface Db { models:Models; }
export interface DbOptions { URL:string, DB_USER:string, DB_PASS:string, DB_PASS_PATH:string, ROOT_CERT_PATH:string; }

export default fp<DbOptions>(async(fastify:FastifyInstance, options:FastifyPluginOptions) => {
  mongoose.connection.on('connected', ()=>{logger.info('db connected');});
  mongoose.connection.on('disconnected', ()=>{logger.info('db disconnected');});
  try {
    if(mongoose.connection.readyState==0) {
      const db = await mongoose.connect('mongodb://'+options.URL, {
        user:options.DB_USER, 
        pass:options.DB_PASS?options.DB_PASS:(await fs.readFile(options.DB_PASS_PATH, "utf8")),
        ssl: true,
        sslValidate: true, 
        sslCA: options.ROOT_CERT_PATH,
        serverSelectionTimeoutMS:1000
      }); 
    }
  } catch(error) { 
    logger.error('error connecting to db: '+error); 
  }
  const models:Models = {Nokia:NokiaModel};
  fastify.decorate('db', {models});
});
