import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import * as createError from 'http-errors';

import { dynamoClient } from './dynamoClient';
import { Auction } from './auction';

export const getAuctionById = async (id: string) => {
  let auction: Auction;

  try {
    const { Item } = await dynamoClient.getItem({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: marshall({ id }),
    });
    auction = unmarshall(Item) as Auction;
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(err);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID ${id} not found`);
  }

  return auction;
};
