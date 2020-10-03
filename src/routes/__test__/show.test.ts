import request from 'supertest';
import { app } from '../../app';

it('should return a 404 if ticket is not found', async () => {
  const response = await request(app)
    .get(`/api/tickets/${global.generatedTicketId}`)
    .send()
    .expect(404);
});
it('should return a ticket if ticket is found', async () => {
  const response = await request(app)
    .post('/api/tickets')
    .set('Cookie', global.getAuthCookie())
    .send({ title: global.validTicketTitle, price: global.validTicketPrice })
    .expect(201);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${response.body.id}`)
    .send()
    .expect(200);

  expect(ticketResponse.body.title).toEqual(global.validTicketTitle);
  expect(ticketResponse.body.price).toEqual(global.validTicketPrice);
});
