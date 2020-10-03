import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import request from 'supertest';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      getAuthCookie(): string[];
      validEmail: string;
      validTicketTitle: string;
      validTicketPrice: number;
      invalidTicketPriceLessThanZero: number;
      invalidTicketId: string;
    }
  }
}

let mongo: any;

beforeAll(async () => {
  process.env.JWT_KEY = 'testSecret';
  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.validEmail = 'test@test.com';
global.validTicketTitle = 'Test Ticket';
global.validTicketPrice = 20;
global.invalidTicketPriceLessThanZero = -10;
global.invalidTicketId = new mongoose.Types.ObjectId().toHexString();

global.getAuthCookie = (): string[] => {
  // build a JWT payload {id, email}
  const payload = {
    id: 'foobar1234',
    email: global.validEmail,
  };

  // create JWT with JWT key
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // build up session object {jwt: fooBarBaz...}
  const session = { jwt: token };

  // turn object into JSON

  const sessionJSON = JSON.stringify(session);

  // encode json as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string that is the cookie with encoded data
  return [`express:sess=${base64}`];
};
