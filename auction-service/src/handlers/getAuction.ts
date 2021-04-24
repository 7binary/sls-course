import createError from 'http-errors';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

import { wrapMiddlewares } from '../lib/wrapMiddlewares';
import { dynamoClient } from '../lib/dynamoClient';

export const getAuctionById = async (id: string) => {
  let auction;

  try {
    const { Item } = await dynamoClient.getItem({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: marshall({ id }),
    });
    auction = unmarshall(Item);
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(err);
  }

  if (!auction) {
    throw new createError.NotFound(`Auction with ID ${id} not found`);
  }

  return auction;
};

const getAuctionAction: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters;
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const getAuction = wrapMiddlewares(getAuctionAction);
