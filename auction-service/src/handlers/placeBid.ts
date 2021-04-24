import createError from 'http-errors';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { wrapMiddlewares } from '../lib/wrapMiddlewares';
import { getAuctionById } from '../lib/getAuctionById';
import { dynamoClient } from '../lib/dynamoClient';
import { AuctionStatus } from '../lib/auction';

const placeBidAction: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters;
  const { amount } = event.body as any;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);
  let updatedAuction;

  if (email === auction.seller) {
    throw new createError.Forbidden('You cannot bid your own auctions!');
  }
  if (email === auction?.highestBid.bidder) {
    throw new createError.Forbidden('You are already the highest bidder');
  }
  if (auction.status !== AuctionStatus.OPEN) {
    throw new createError.Forbidden('Auction should be opened for bidding');
  }
  if (!('highestBid' in auction)) {
    throw new createError.Forbidden(`Auction don't have highestBid amount`);
  }
  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}`);
  }

  try {
    const { Attributes } = await dynamoClient.updateItem({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: marshall({ id }),
      UpdateExpression: 'SET highestBid.amount = :amount, highestBid.bidder = :bidder',
      ExpressionAttributeValues: marshall({
        ':amount': amount,
        ':bidder': email,
      }),
      ReturnValues: 'ALL_NEW',
    });
    updatedAuction = unmarshall(Attributes);
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
};

const schema = { // <Json Schema> againts <event.body>
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      required: ['amount'],
      properties: {
        amount: { type: 'integer', 'minimum': 1, 'exclusiveMaximum': 1000000 },
      },
    },
  },
};

export const placeBid = wrapMiddlewares(placeBidAction, schema);
