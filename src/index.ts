import mongoose from 'mongoose';
import { app } from './app';
import { NotFoundError } from '@nielsendigital/ms-common';

const startApp = async () => {
  if (!process.env.JWT_KEY) {
    throw new NotFoundError('JWT_KEY k8s secret must be defined.');
  }
  if (!process.env.MONGO_URI) {
    throw new NotFoundError('MONGO_URI k8s env var must be defined.');
  }
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    console.log('Connected to mongoDB');
  } catch (err) {
    console.log(err);
  }
  app.listen(3000, () => {
    console.log('>>>>> Ticket service listening on port 3000.');
  });
};

startApp();
