import { DynamoDB } from '@aws-sdk/client-dynamodb';

export const dynamoClient = new DynamoDB({ region: 'eu-west-1'});
