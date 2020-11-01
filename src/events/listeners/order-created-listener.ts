import { Listener, OrderCreatedEvent, Topics, queueGroupNames, NotFoundError } from '@nielsendigital/ms-common';
import { Message } from 'node-nats-streaming';
import { Ticket } from '../../models/ticket';
import { TicketUpdatedPublisher } from '../publishers/ticket-updated-publisher';

export class OrderCreatedListener extends Listener<OrderCreatedEvent> {
  readonly topic = Topics.OrderCreated;
  queueGroupName = queueGroupNames.TICKETS_SERVICE;

  async onMessage(data: OrderCreatedEvent['data'], msg: Message) {
    // 1. find reserved ticket by orderId from tickets collection

    const ticket = await Ticket.findById(data.ticket.id);

    // 2. if no ticket, throw error
    if (!ticket) {
      throw new NotFoundError(`Ticket not found with provided id.`);
    }

    // 3. if ticket found, mark ticket as reserved by setting orderId property
    ticket.set({ orderId: data.id });

    // 4. save the ticket
    await ticket.save();

    // 5. publish event for updated ticket
    //    i.e., listener publishes its own events with the same client that
    //    it's using for listening.

    // Practical note: listing out each property individually as opposed to
    // calling .publish(ticket) is better practice because we have transparency
    // into what properties are used and with what values.
    await new TicketUpdatedPublisher(this.client).publish({
      id: ticket.id,
      userId: ticket.userId,
      version: ticket.version,
      orderId: ticket.orderId,
      title: ticket.title,
      price: ticket.price,
    });

    // 6. ack the message to NATS
    msg.ack();
  }
}
