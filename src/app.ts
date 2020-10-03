import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';

import {
  currentUser,
  errorHandler,
  NotFoundError,
} from '@nielsendigital/ms-common';

// Routers
import { createTicketRouter } from './routes/new';
import { showTicketRouter } from './routes/show';
import { IndexTicketRouter } from './routes/index';

const app = express();
// allows for ingress-nginx proxy
app.set('trust proxy', true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);
// currentUser must be used after the CookieSession creates req.cookie
app.use(currentUser);
app.use(createTicketRouter);
app.use(showTicketRouter);
app.use(IndexTicketRouter);

app.all('*', async (req, res, next) => {
  throw new NotFoundError('Page not found.');
});

app.use(errorHandler);

export { app };
