import { OrderCreatedListener } from '../order-created-listener';
import { Ticket } from '../../../models/ticket';
import { natsWrapper, OrderData, OrderStatus, Topics } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';

const setup = async () => {
  // create instance of listener
  const listener = new OrderCreatedListener(natsWrapper.client);

  // create and save a ticket
  const ticket = Ticket.build(global.ticketBodyValid);

  await ticket.save();

  // create mock data object satisfying the OrderCreatedEvent Interface
  const data: OrderData = {
    id: global.generatedOrderId,
    version: 0,
    status: OrderStatus.Created,
    userId: 'userIdTestValue',
    expiresAt: 'expiresAtTestValue',
    ticket: {
      id: ticket.id,
      price: ticket.price,
      title: ticket.title,
      version: ticket.version,
      userId: ticket.userId,
    },
  };

  // @ts-ignore
  const msg: Message = {
    ack: jest.fn(),
  };

  return { listener, ticket, data, msg };
};

it('should set the userId of the ticket', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  const updatedTicket = await Ticket.findById(ticket.id);

  expect(updatedTicket!.orderId).toEqual(data.id);
});

it('should ack the message', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(msg.ack).toHaveBeenCalledTimes(1);
});

it('should publish a ticket-updated event', async () => {
  const { listener, ticket, data, msg } = await setup();

  await listener.onMessage(data, msg);

  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);

  // verifiy that the listener has published an event of the correct type with
  // the correct data.

  // tip typescript off that publish is a mock function
  (natsWrapper.client.publish as jest.Mock).mock.calls[0];

  // @ts-ignore
  let [topic, pubData] = natsWrapper.client.publish.mock.calls[0];
  pubData = JSON.parse(pubData);
  expect(topic).toEqual(Topics.TicketUpdated);
  expect(pubData.id).toEqual(ticket.id);
  expect(pubData.orderId).toEqual(data.id);
});
