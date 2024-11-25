// MongoDB Handler

// Imports
import * as mongo from '@db/mongo';

// MongoDB Handler
export class DBHandler {
  private client: mongo.MongoClient = new mongo.MongoClient();
  private mongoURI = Deno.env.get('MONGO_URI');

  constructor() {
    // Initialize
    if ( !this.mongoURI ) {
      throw new Error('MONGO_URI not found in environment variables.');
    }

    this.client.connect( this.mongoURI );
  }

  // Get All
  public async getAll(collection: string): Promise<any> {
      return await this.client.getAll(collection);
  }

  // Get By ID
  public async getByID(collection: string, id: string): Promise<any> {
      return await this.client.getByID(collection, id);
  }

  // Create
  public async create(collection: string, data: any): Promise<any> {
      return await this.client.create(collection, data);
  }

  // Update
  public async update(collection: string, id: string, data: any): Promise<any> {
      return await this.client.update(collection, id, data);
  }

  // Delete
  public async delete(collection: string, id: string): Promise<any> {
      return await this.client.delete(collection, id);
  }

  // Close
  public close() {
    this.client.close();
  }
}