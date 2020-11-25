import { natsWrapper, OrderCanceledEvent, OrderData, OrderStatus, Topics } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../../models/ticket';
import { OrderCanceledListener } from '../order-canceled-listener';

const setup = async () => {
  const listener = new OrderCanceledListener(natsWrapper.client);

  // NOTE : ticket.orderId indicates the ticket is reserved.
  const orderId = global.generatedOrderId;
  // build ticket
  const ticket = Ticket.build(global.ticketBodyValid);
  // add orderId to ticket
  ticket.set({ orderId });

  // save ticket
  await ticket.save();

  const data: OrderData = {
    id: orderId,
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

  return { msg, data, ticket, orderId, listener };
};

it('updates ticket, publishes event, & acks message', async () => {
  const { listener, ticket, data, msg } = await setup();

  // the orderCanceled listener will remove orderId and publish a
  // ticket:updated event.
  await listener.onMessage(data, msg);

  // get another instance of ticet from db
  const updatedTicket = await Ticket.findById(ticket.id);

  // verify that orderId is unset on sucessful cancel
  expect(updatedTicket!.orderId).toBeUndefined();

  // msg.ack called only once
  expect(msg.ack).toHaveBeenCalledTimes(1);
  // verify that only one ticket:updated event has been sent
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(1);

  // tip typescript off that publish is a mock function
  (natsWrapper.client.publish as jest.Mock).mock.calls[0];

  // @ts-ignore
  let [topic, pubData] = natsWrapper.client.publish.mock.calls[0];
  pubData = JSON.parse(pubData);
  // verifiy that the ticket:updated event has been published after cancel
  expect(topic).toEqual(Topics.TicketUpdated);
  // verify consistency of the tickets
  expect(pubData.id).toEqual(ticket.id);
  // verify that the orderId for the ticket is still undefined
  expect(pubData.orderId).toBeUndefined();
});
