import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '../app';
import request, { Test } from 'supertest';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      getUserIdFromCookie(cookie: string): string;
      getAuthCookie(): string[];
      validEmail: string;
      validTicketTitle: string;
      validTicketTitleUpdated: string;
      validTicketPrice: number;
      validTicketPriceUpdated: number;
      invalidTicketPriceLessThanZero: number;
      generatedTicketId: string;
      OMIT_VALIDATION_COOKIE: undefined;
      USE_GENERATED_COOKIE: null;
      getTicket(ticketId: string): Test;
      createTicket(body: object, userCookie?: string[] | null): Test;
      changeTicket(
        body: object,
        userCookie: string[] | null | undefined,
        ticketId?: string | null
      ): Test;
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

const getMongooseId = () => {
  return new mongoose.Types.ObjectId().toHexString();
};

global.validEmail = 'test@test.com';
global.validTicketTitle = 'Test Ticket';
global.validTicketTitleUpdated = 'Updated Test Ticket';
global.validTicketPrice = 20;
global.validTicketPriceUpdated = 100;
global.invalidTicketPriceLessThanZero = -10;
global.generatedTicketId = getMongooseId();

global.getAuthCookie = (): string[] => {
  // build a JWT payload {id, email}
  const payload = {
    // random generated id
    id: getMongooseId(),
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

global.getUserIdFromCookie = (cookie: string): string => {
  // removes the `express:sess=` prefix from the cookie so that
  // all that remains is the base64 encoded jwt
  const dePrefixedCookie = cookie.replace('express:sess=', '');
  // decode base64 cookie
  const decodedCookie = JSON.parse(atob(dePrefixedCookie));

  /**
   * get jwt body which is divided into three parts:
   * 1. Header (algorithm & token type)
   * 2. payload (data)
   * 3. signature verification
   *
   * So when we decode the cookie we'll structurally get this:
   * {
   *  jwt: "header.payload.signature"
   * }
   *
   * We need to slice that string on the periods and grab the payload.
   */

  if (!decodedCookie.jwt) {
    throw new Error('jwt undefined');
  }
  const jwtPayload = JSON.parse(decodedCookie.jwt.slice('.')[1]);
  /**
   * jwtPayload should be an object that looks like this:
   * {
   *  "id":"5f78a98a68793cc7781e7b5d",
   *  "email":"test@test.com",
   *  "iat":1601743242
   * }
   */

  if (!jwtPayload.id) {
    throw new Error('could not find userId in JWT payload');
  }

  return jwtPayload.id;
};

global.OMIT_VALIDATION_COOKIE = undefined;
global.USE_GENERATED_COOKIE = null;

global.getTicket = (ticketId) => {
  return request(app).get(`/api/tickets/${ticketId}`).send();
};

global.createTicket = (body, userCookie = null) => {
  const _userCookie = userCookie ? userCookie : global.getAuthCookie();

  return request(app)
    .post('/api/tickets')
    .set('Cookie', _userCookie)
    .send(body);
};

global.changeTicket = (body, userCookie, ticketId = null) => {
  const _ticketId = ticketId ? ticketId : global.generatedTicketId;
  // prefer provided cookie. `null` will generate a cookie. `undefined` will omit setting the auth cookie.
  switch (userCookie) {
    case global.OMIT_VALIDATION_COOKIE:
      return request(app).put(`/api/tickets/${_ticketId}`).send(body);
      break;
    case global.USE_GENERATED_COOKIE:
      return request(app)
        .put(`/api/tickets/${_ticketId}`)
        .set('Cookie', global.getAuthCookie())
        .send(body);
      break;
    default:
      return request(app)
        .put(`/api/tickets/${_ticketId}`)
        .set('Cookie', userCookie)
        .send(body);
      break;
  }
};
