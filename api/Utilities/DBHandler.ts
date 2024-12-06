// MongoDB Handler

// Imports
import * as mongo from '@db/mongo';

// MongoDB Handler
export class DBHandler {
  private client: mongo.MongoClient = new mongo.MongoClient();
  private mongoURI = Deno.env.get('MONGO_URI');
  private mongoDBName = Deno.env.get('MONGO_DB_NAME');

  private database!: mongo.Database;

  constructor() {
    // Initialize
    if ( !this.mongoURI ) {
      throw new Error('MONGO_URI not found in environment variables.');
    }

    this.initialize().then(() => {
      console.log('MongoDB connected.');
    });
  }

  private async initialize() {
    await this.client.connect( this.mongoURI! );

    this.mongoDBName = Deno.env.get( 'MONGO_DB_NAME' );

    if ( !this.mongoDBName ) {
      throw new Error('MONGO_DB_NAME not found in environment variables.');
    }

    this.database = this.client.database( this.mongoDBName );
  }

  public async selectOneById( collection: string, docId: number | string ) {
    return await this.database.collection( collection ).findOne( { id: docId });
  }

  public async selectOneByFilter( collection: string, filter: object ) {
    return await this.database.collection( collection ).findOne( filter );
  }

  public selectMany( collection: string, query: object, filter: mongo.FindOptions ) {
    return this.database.collection( collection ).find( query, filter ).toArray();
  }

  public async insertOne( collection: string, doc: object ) {
    return await this.database.collection( collection ).insertOne( doc );
  }

  // Close
  public close() {
    this.client.close();
  }
}