import { natsWrapper } from '@nielsendigital/ms-common';
import { Ticket } from '../../models/ticket';

it('should return a 404 if provided ticketID does not exist', async () => {
  await global
    .changeTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      global.USE_GENERATED_COOKIE
    )
    .expect(404);
});

it('should return a 401 if user is not authenticated', async () => {
  await global
    .changeTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      global.OMIT_VALIDATION_COOKIE
    )
    .expect(401);
});

it('should return a 401 if the user does not own the ticket', async () => {
  const user1Cookie = global.getAuthCookie();
  const user2Cookie = global.getAuthCookie();

  const createTicketResponse = await global.createTicket(
    {
      title: global.validTicketTitle,
      price: global.validTicketPrice,
    },
    user1Cookie
  );

  await global
    .changeTicket(
      {
        title: global.validTicketTitleUpdated,
        price: global.validTicketPriceUpdated,
      },
      user2Cookie,
      createTicketResponse.body.id
    )
    .expect(401);

  // validate that the record in the db has not been changed on a failed PUT
  const getTicketResponse = await global.getTicket(createTicketResponse.body.id).expect(200);

  // ticket title and price should still equal original values
  expect(getTicketResponse.body.title).toEqual(global.validTicketTitle);
  expect(getTicketResponse.body.price).toEqual(global.validTicketPrice);
});

it('should return a 400 if user provides invalid title or price', async () => {
  const user1Cookie = global.getAuthCookie();

  const createTicketResponse = await global
    .createTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      user1Cookie
    )
    .expect(201);

  await global
    .changeTicket(
      {
        title: '',
        price: global.validTicketPriceUpdated,
      },
      user1Cookie,
      createTicketResponse.body.id
    )
    .expect(400);

  await global
    .changeTicket(
      {
        title: global.validTicketTitle,
        price: global.invalidTicketPriceLessThanZero,
      },
      user1Cookie,
      createTicketResponse.body.id
    )
    .expect(400);
});
it('should update the ticket provided valid inputs and authentication', async () => {
  const user1Cookie = global.getAuthCookie();

  const createTicketResponse = await global
    .createTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      user1Cookie
    )
    .expect(201);

  // update the ticket
  await global
    .changeTicket(
      {
        title: global.validTicketTitleUpdated,
        price: global.validTicketPriceUpdated,
      },
      user1Cookie,
      createTicketResponse.body.id
    )
    .expect(200);

  // validate that the record in the db has not been changed on a failed PUT
  const getTicketResponse = await global.getTicket(createTicketResponse.body.id).expect(200);

  // ticket title and price should still equal updated values
  expect(getTicketResponse.body.title).toEqual(global.validTicketTitleUpdated);
  expect(getTicketResponse.body.price).toEqual(global.validTicketPriceUpdated);
});

it('should publish an event', async () => {
  const user1Cookie = global.getAuthCookie();
  const createTicketResponse = await global
    .createTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      user1Cookie
    )
    .expect(201);

  // update the ticket
  await global
    .changeTicket(
      {
        title: global.validTicketTitleUpdated,
        price: global.validTicketPriceUpdated,
      },
      user1Cookie,
      createTicketResponse.body.id
    )
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('should reject ticket when ticket is reserved', async () => {
  // establish user
  const user1Cookie = global.getAuthCookie();
  // create ticket to test.
  const createTicketResponse = await global
    .createTicket(
      {
        title: global.validTicketTitle,
        price: global.validTicketPrice,
      },
      user1Cookie
    )
    .expect(201);

  // retrieve the just created ticket from the db
  const ticket = await Ticket.findById(createTicketResponse.body.id);
  ticket?.set({ orderId: global.generatedOrderId });
  await ticket?.save();

  // update the reserved ticket
  await global
    .changeTicket(
      {
        title: global.validTicketTitleUpdated,
        price: global.validTicketPriceUpdated,
      },
      user1Cookie,
      createTicketResponse.body.id
    )
    .expect(400);
});
