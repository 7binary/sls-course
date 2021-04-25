import { Auction, AuctionStatus } from './auction';
import { dynamoClient } from './dynamoClient';
import { marshall } from '@aws-sdk/util-dynamodb';
import { SQS } from 'aws-sdk';

const sqs = new SQS({ region: 'eu-west-1' });

export const closeAuction = async (auction: Auction) => {
  await dynamoClient.updateItem({
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

  const { highestBid, title, seller } = auction;
  const { amount, bidder } = highestBid;

  if (!amount) {
    return await sqs.sendMessage({
      QueueUrl: process.env.MAIL_QUEUE_URL,
      MessageBody: JSON.stringify({
        subject: `Your auction <${title}> is closed`,
        body: `Auction <${title}> has been closed without any bids`,
        recipient: seller,
      }),
    }).promise();
  }

  const notifySeller = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: `Your auction <${title}> has been sold!`,
      body: `Congratulations! Auction <${title}> has been sold for ${amount} $`,
      recipient: seller,
    }),
  }).promise();

  const notifyBidder = sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject: `You have won the auction <${title}>`,
      body: `Congratulations! Auction <${title}> is yours. Money reserved: ${amount} $`,
      recipient: bidder,
    }),
  }).promise();

  return Promise.all([notifySeller, notifyBidder]);
};
