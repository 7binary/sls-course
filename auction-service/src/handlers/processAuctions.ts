import * as createError from 'http-errors';
import { getEndedAuctions } from '../lib/getEndedAuctions';
import { closeAuction } from '../lib/closeAuction';

export const processAuctions = async () => {
  console.info('processing auctions...');

  try {
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map(auction => closeAuction(auction));
    await Promise.all(closePromises);

    return { closed: closePromises.length };
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError(err);
  }
};
