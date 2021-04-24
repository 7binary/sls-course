import { Auction, AuctionStatus } from './auction';
import { dynamoClient } from './dynamoClient';
import { marshall } from '@aws-sdk/util-dynamodb';

export const closeAuction = async (auction: Auction) => {
  return dynamoClient.updateItem({
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: marshall({
      id: auction.id,
    }),
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeValues: marshall({
      ':status': AuctionStatus.CLOSED,
    }),
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  });
};
