import express, { Request, Response } from 'express';
import { Ticket } from '../models/ticket';
import { logIt, LogType, NotFoundError } from '@nielsendigital/ms-common';

const router = express.Router();

router.get('/api/tickets/:id', async (req: Request, res: Response) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) {
    logIt.out(LogType.ERROR, 'Ticket not found');
    throw new NotFoundError('Ticket not found');
  }
  res.status(200).send(ticket);
});

export { router as showTicketRouter };
