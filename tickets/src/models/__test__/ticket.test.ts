import { Ticket } from '../ticket';

// testing optimistic currency control
// done() callback tells just manually that the test is complete
it('should increment version property on update', async (done) => {
  // create instance of the ticket
  const ticket = Ticket.build({
    title: global.validTicketTitle,
    price: global.validTicketPrice,
    userId: '123',
  });

  // save the ticket to the database
  await ticket.save();

  // fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // make changes to both tickets
  firstInstance!.set({ price: global.validTicketPriceUpdated });
  secondInstance!.set({ price: global.validTicketPriceUpdated });

  // save the first fetched ticket
  await firstInstance!.save();

  // expect to see an error when saving the second fetched ticket

  // currently jest's expect().toThrow and expect().toThrowError don't
  // seem to work with async functions as expected
  try {
    await secondInstance!.save();
  } catch (err) {
    return done();
  }
  throw new Error('Should not reach this point');
});

it('should increment version number when ticket saved', async () => {
  const ticket = Ticket.build({
    title: global.validTicketTitle,
    price: global.validTicketPrice,
    userId: '123',
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
