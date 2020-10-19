import mongoose from 'mongoose';
import { app } from './app';
import {
  NotFoundError,
  logIt,
  LogType,
  natsWrapper,
} from '@nielsendigital/ms-common';

const startApp = async () => {
  logIt.out(LogType.STARTED, 'tickets service started');
  // verify env vars are present

  if (!process.env.JWT_KEY) {
    throw new NotFoundError('JWT_KEY k8s secret must be defined.');
  }
  if (!process.env.MONGO_URI) {
    throw new NotFoundError('MONGO_URI k8s env var must be defined.');
  }

  if (!process.env.NATS_CLUSTER_ID) {
    throw new NotFoundError('NATS_CLUSTER_ID k8s env var must be defined.');
  }

  if (!process.env.NATS_CLIENT_ID) {
    throw new NotFoundError('NATS_CLIENT_ID k8s env var must be defined.');
  }

  if (!process.env.NATS_URL) {
    throw new NotFoundError('NATS_URL k8s env var must be defined.');
  }

  logIt.out(LogType.INFO, 'All required ENV Vars verified as defined');

  // connect to NATS

  try {
    logIt.out(LogType.INFO, 'Attempting connection to NATS');

    await natsWrapper.connect(
      // see infra/k8s/tickets-depl.yaml for values
      process.env.NATS_CLUSTER_ID,
      process.env.NATS_CLIENT_ID,
      process.env.NATS_URL
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
    logIt.out(LogType.INFO, 'Attempting connection to MongoDB');

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
