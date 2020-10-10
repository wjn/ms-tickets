import nats, { Stan } from 'node-nats-streaming';
import { logIt, LogType } from '@nielsendigital/ms-common';

class NatsWrapper {
  private _client?: Stan;

  // this is a typescript 'getter' which means it's called as `natsWrapper.client`
  // NOT natsWrapper.client() -- no parentheses.
  public get client() {
    if (!this._client) {
      logIt.out(LogType.FAIL, 'Cannot access NATS client before connecting.');
      throw new Error('Cannot access NATS client before connecting.');
    }
    return this._client;
  }

  // create NATS Connection

  public connect(clusterId: string, clientId: string, url: string) {
    this._client = nats.connect(clusterId, clientId, { url });

    return new Promise((resolve, reject) => {
      this.client.on('connect', () => {
        logIt.out(LogType.SUCCESS, 'Connected to NATS');
        resolve();
      });
      this.client.on('error', (err) => {
        reject({
          type: 'NATS ERROR',
          file: `${__filename}`,
          error: err,
        });
      });
    });
  }
}

export const natsWrapper = new NatsWrapper();
