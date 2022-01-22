import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';

export default class dbHandler {
  private server?:MongoMemoryServer;

  public static factory = async() => {
    const generated = new dbHandler();
    generated.server = await MongoMemoryServer.create();
    return generated;
  };

  async connect(dbName:string) {
    if(!this.server) this.server = await MongoMemoryServer.create();
    const uri = this.server.getUri();
    await mongoose.connect(uri, {dbName: dbName});
  }

  async closeDatabase() {
    if(!this.server) this.server = await MongoMemoryServer.create();
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await this.server.stop();
  }

  async clearDatabase() {
    const collections = mongoose.connection.collections;
    for(const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}
