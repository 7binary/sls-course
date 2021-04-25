import { S3 } from 'aws-sdk';

const s3 = new S3({ region: 'eu-west-1' });

export const uploadImageToS3 = async (bucketName: string, filename: string, buffer: Buffer) => {
  const result = await s3.upload({
    Bucket: bucketName,
    Key: filename,
    Body: buffer,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
  }).promise();

  return result.Location;
};
