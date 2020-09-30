import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import request from 'supertest';

declare global {
  namespace NodeJS {
    interface Global {
      getAuthCookie(): Promise<string[]>;
      validEmail: string;
      invalidEmail: string;
      unknownEmail: string;
      validPassword: string;
      invalidPassword: string;
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
global.invalidEmail = 'test@test';
global.unknownEmail = 'unknown@test.com';
global.validPassword = 'password';
global.invalidPassword = 'invalid password';

global.getAuthCookie = async (): Promise<string[]> => {
  const email = global.validEmail;
  const password = global.validPassword;

  const response = await request(app)
    .post('/api/users/signup')
    .send({
      email,
      password,
    })
    .expect(201);

  const cookie = response.get('Set-Cookie');

  return cookie;
};
