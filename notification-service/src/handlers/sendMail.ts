import { SQSEvent, SQSHandler } from 'aws-lambda';
import { SES } from 'aws-sdk';
import { SendEmailRequest, SendEmailResponse } from 'aws-sdk/clients/ses';

const ses = new SES({ region: 'eu-west-1' });

export const sendMail: SQSHandler = async (event: SQSEvent) => {
  try {
    const results: SendEmailResponse[] = [];

    for (const record of event.Records) {
      console.log('> record processing: ', record);
      const { subject, body, bodyHtml, recipient } = JSON.parse(record.body);

      const params: SendEmailRequest = {
        Source: 'zineof@gmail.com',
        Destination: {
          ToAddresses: [recipient],
        },
        Message: {
          Subject: { Data: subject, Charset: 'utf-8' },
          Body: {
            Text: { Data: body, Charset: 'utf-8' },
          },
        },
      };
      if (bodyHtml) {
        params.Message.Body.Html = { Data: bodyHtml, Charset: 'utf-8' };
      }

      const result: SendEmailResponse = await ses.sendEmail(params).promise();
      console.log(result);
      results.push(result);
    }

    return results.length;

  } catch (error) {
    console.log(error);
    return error;
  }
};
