import {
  Publisher,
  Topics,
  TicketUpdatedEvent,
} from '@nielsendigital/ms-common';

export class TicketUpdatedPublisher extends Publisher<TicketUpdatedEvent> {
  readonly topic = Topics.TicketUpdated;
}
