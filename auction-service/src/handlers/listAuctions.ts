import createError from 'http-errors';
import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { QueryInput } from '@aws-sdk/client-dynamodb';

import { wrapMiddlewares } from '../lib/wrapMiddlewares';
import { dynamoClient } from '../lib/dynamoClient';
import { Auction, AuctionStatus } from '../lib/auction';

const listAuctionsAction: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { status } = event.queryStringParameters;
  console.info('status', status);
  let auctions: Auction[] = [];

  const params: QueryInput = { TableName: process.env.AUCTIONS_TABLE_NAME };
  if (status) {
    params.IndexName = 'statusAndEndDate';
    params.KeyConditionExpression = '#status = :status';
    params.ExpressionAttributeNames = { '#status': 'status' };
    params.ExpressionAttributeValues = marshall({
      ':status': status,
    }, { removeUndefinedValues: true });
  }

  try {
    const { Items } = await (status ? dynamoClient.query(params) : dynamoClient.scan(params));
    auctions = Items.map(Item => unmarshall(Item) as Auction);
  } catch (err) {
    console.error(err);
    throw new createError.InternalServerError(err);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

const schema = { // <Json Schema> againts <event.queryStringParameters>
  type: 'object',
  required: ['queryStringParameters'],
  properties: {
    queryStringParameters: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { enum: [AuctionStatus.OPEN, AuctionStatus.CLOSED], default: AuctionStatus.OPEN },
      },
    },
  },
};

export const listAuctions = wrapMiddlewares(listAuctionsAction, schema);
