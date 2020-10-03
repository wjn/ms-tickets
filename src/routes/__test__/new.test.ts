import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('should have a route handler listening to /api/tickets for POST requests', async () => {
  const response = await request(app).post('/api/tickets').send({});

  expect(response.status).not.toEqual(404);
});

it('should only be accessed if user is authenticated', async () => {
  await request(app).post('/api/tickets').send({}).expect(401);
});

it('should return a status other than 401 if user is authenticated', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({});

  expect(response.status).not.toEqual(401);
});

it('should return an error if invalid title is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({
      price: global.validTicketPrice,
    })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({
      title: '',
      price: global.validTicketPrice,
    })
    .expect(400);
});
it('should return an error if invalid price is provided', async () => {
  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({
      title: global.validTicketTitle,
    })
    .expect(400);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({
      title: global.validTicketTitle,
      price: global.invalidTicketPriceLessThanZero,
    })
    .expect(400);
});
it('should create a ticket with valid inputs', async () => {
  // since we delete everything in the database when we start
  // this means that we always start with 0 records.
  let tickets = await Ticket.find({});
  expect(tickets.length).toEqual(0);

  await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({
      title: global.validTicketTitle,
      price: global.validTicketPrice,
    })
    .expect(201);

  tickets = await Ticket.find({});
  expect(tickets.length).toEqual(1);
  expect(tickets[0].title).toEqual(global.validTicketTitle);
  expect(tickets[0].price).toEqual(global.validTicketPrice);
});
