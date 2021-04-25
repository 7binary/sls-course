import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import { wrapMiddlewares } from '../lib/wrapMiddlewares';
import { getAuctionById } from '../lib/getAuctionById';
import { uploadImageToS3 } from '../lib/uploadImageToS3';
import createError from 'http-errors';
import { dynamoClient } from '../lib/dynamoClient';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const uploadAuctionPictureAction: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent) => {
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionById(id);
  const base64 = event.body.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');

  if (auction.seller !== email) {
    throw new createError.Unauthorized('You are not the seller of this auction');
  }

  try {
    const pictureUrl = await uploadImageToS3(
      process.env.AUCTIONS_BUCKET_NAME,
      auction.id + '.jpg',
      buffer,
    );
    console.log('> auction pictureUrl: ', pictureUrl);

    const { Attributes } = await dynamoClient.updateItem({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      Key: marshall({ id }),
      UpdateExpression: 'SET pictureUrl = :pictureUrl',
      ExpressionAttributeValues: marshall({
        ':pictureUrl': pictureUrl,
      }),
      ReturnValues: 'ALL_NEW',
    });
    const updatedAuction = unmarshall(Attributes);

    return {
      statusCode: 200,
      body: JSON.stringify(updatedAuction),
    };
  } catch (err) {
    console.log(err);
    throw new createError.InternalServerError(err);
  }
};

const schema = { // <Json Schema> againts <event.body>
  type: 'object',
  required: ['body'],
  properties: {
    body: { type: 'string', allOf: [{ 'transform': ['trim'] }, { 'minLength': 1 }] },
  }
};

export const uploadAuctionPicture = wrapMiddlewares(uploadAuctionPictureAction, schema);
