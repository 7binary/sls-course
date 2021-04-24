import { v4 as uuid } from 'uuid';
import createError from 'http-errors';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { marshall } from '@aws-sdk/util-dynamodb';

import { wrapMiddlewares } from '../lib/wrapMiddlewares';
import { dynamoClient } from '../lib/dynamoClient';
import { Auction, AuctionStatus } from '../lib/auction';

const createAuctionAction: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { title } = event.body as any;
  const { email } = event.requestContext.authorizer;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(endDate.getHours() + 1);

  const auction: Auction = {
    id: uuid(),
    title,
    status: AuctionStatus.OPEN,
    highestBid: {
      amount: 0,
    },
    seller: email,
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
  };

  try {
    await dynamoClient.putItem({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Item: marshall(auction),
    });
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

const schema = { // <Json Schema> againts <event.body>
  type: 'object',
  required: ['body'],
  properties: {
    body: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', allOf: [{ 'transform': ['trim'] }, { 'minLength': 1 }] },
      },
    },
  },
};

export const createAuction = wrapMiddlewares(createAuctionAction, schema);
