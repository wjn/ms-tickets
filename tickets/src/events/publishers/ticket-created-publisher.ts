import {
  Publisher,
  Topics,
  TicketCreatedEvent,
} from '@nielsendigital/ms-common';

export class TicketCreatedPublisher extends Publisher<TicketCreatedEvent> {
  readonly topic = Topics.TicketCreated;
}
