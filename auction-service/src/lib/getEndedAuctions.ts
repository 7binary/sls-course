import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { dynamoClient } from './dynamoClient';
import { Auction, AuctionStatus } from './auction';

export const getEndedAuctions = async () => {
  const { Items } = await dynamoClient.query({
    TableName: process.env.AUCTIONS_TABLE_NAME,
    IndexName: 'statusAndEndDate',
    KeyConditionExpression: '#status = :status AND endingAt <= :now',
    ExpressionAttributeValues: marshall({
      ':status': AuctionStatus.OPEN,
      ':now': new Date().toISOString(),
    }),
    ExpressionAttributeNames: { '#status': 'status' },
  });

  return Items.map(i => unmarshall(i) as Auction);
};
