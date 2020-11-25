import { Listener, NotFoundError, OrderCanceledEvent, queueGroupNames, Topics } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCanceledListener extends Listener<OrderCanceledEvent> {
  readonly topic = Topics.OrderCanceled;
  queueGroupName = queueGroupNames.TICKETS_SERVICE;

  async onMessage(data: OrderCanceledEvent['data'], msg: Message) {
    // find ticket or
    const ticket = await Ticket.findById(data.ticket.id);

    // throw error
    if (!ticket) {
      throw new NotFoundError('Ticket was not found for cancelation.');
    }

    // remove orderId
    ticket.set({ orderId: undefined });

    // save ticket
    await ticket.save();

    // publish the order canceled event
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      orderId: ticket.orderId,
      version: ticket.version,
      userId: ticket.userId,
      title: ticket.title,
      price: ticket.price,
    });

    // ack NATS msg
    msg.ack();
  }
}
