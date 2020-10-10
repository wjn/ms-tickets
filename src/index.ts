import mongoose from 'mongoose';
import { app } from './app';
import { NotFoundError, logIt, LogType } from '@nielsendigital/ms-common';
import { natsWrapper } from './nats-wrapper';

const startApp = async () => {
  // verify env vars are present

  if (!process.env.JWT_KEY) {
    throw new NotFoundError('JWT_KEY k8s secret must be defined.');
  }
  if (!process.env.MONGO_URI) {
    throw new NotFoundError('MONGO_URI k8s env var must be defined.');
  }

  logIt.out(LogType.INFO, 'All required ENV Vars verified as defined');

  // connect to NATS

  try {
    await natsWrapper.connect(
      'ticketing',
      'asdfasf222',
      'http://nats-srv:4222'
    );
    // process graceful exit
    natsWrapper.client.on('close', () => {
      logIt.out(LogType.STOPPED, 'NATS Connection Closed');
      process.exit();
    });
    // gracefully exit
    process.on('SIGINT', () => natsWrapper.client.close());
    process.on('SIGTERM', () => natsWrapper.client.close());
  } catch (err) {
    logIt.out(LogType.ERROR, 'NATS failed to load.');
    logIt.out(LogType.ERROR, err);
  }

  // connect to MongoDB

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    logIt.out(LogType.SUCCESS, 'Connected to mongoDB');
  } catch (err) {
    logIt.out(LogType.ERROR, err);
  }

  // Listen for traffic
  app.listen(3000, () => {
    logIt.out(LogType.INFO, '>>>>> Ticket service listening on port 3000.');
  });
};

startApp();
