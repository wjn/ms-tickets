import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSession from 'cookie-session';

import { errorHandler, NotFoundError } from '@nielsendigital/ms-common';

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

app.all('*', async (req, res, next) => {
  throw new NotFoundError('Page not found.');
});

app.use(errorHandler);

export { app };
