import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  validateRequest,
  NotFoundError,
  requireAuth,
  natsWrapper,
  NotAuthorizedError,
  BadRequestError,
} from '@nielsendigital/ms-common';
import { Ticket } from '../models/ticket';
import { TicketUpdatedPublisher } from '../events/publishers/ticket-updated-publisher';

const router = express.Router();

router.put(
  '/api/tickets/:id',
  requireAuth,
  [
    body('title').not().isEmpty().withMessage('Title is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than zero.'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    // find requested ticket
    const ticket = await Ticket.findById(req.params.id);

    // verify that a ticket was found
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    // verify that currentUser is the ticket owner
    if (ticket.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    // verify that ticket is not reserved by an Order
    // Tickets being considered for purchase cannot be changed.
    if (ticket.orderId) {
      throw new BadRequestError(
        'Ticket is currently under consideration for purchase and cannot be edited at this time.'
      );
    }

    ticket.set({ title: req.body.title, price: req.body.price });
    // save to mongoDB
    await ticket.save();

    // send update event
    new TicketUpdatedPublisher(natsWrapper.client).publish({
      id: ticket.id,
      title: ticket.title,
      price: ticket.price,
      userId: ticket.userId,
      version: ticket.version,
    });
    res.send(ticket);
  }
);

export { router as updateTicketRouter };
