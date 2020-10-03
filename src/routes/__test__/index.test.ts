import request from 'supertest';
import { app } from '../../app';

const createTicket = () => {
  return request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({ title: global.validTicketTitle, price: global.validTicketPrice })
    .expect(201);
};

it('should fetch a list of tickets', async () => {
  // create 3 tickets
  await createTicket();
  await createTicket();
  await createTicket();

  // retrieve all tickets
  const response = await request(app)
    .get(`/api/tickets`)
    .set('Cookie', global.getAuthCookie())
    .send()
    .expect(200);

  // total amount of tickets should be 3
  expect(response.body.length).toEqual(3);
});
