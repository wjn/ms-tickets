export const natsWrapper = {
  client: {
    publish: jest
      .fn()
      .mockImplementation(
        (topic: string, data: string, callback: () => void) => {
          callback();
        }
      ),
  },
};
