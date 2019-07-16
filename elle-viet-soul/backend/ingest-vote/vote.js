/**
 * Receive and valide vote, then publish the vote to SNS
 */
'use strict';

var AWS = require('aws-sdk');  
AWS.config.region = 'ap-southeast-1';

let sns = new AWS.SNS();

/**
 * This function will publish a message as an event to a topic.
 * @param {*} subject 
 * @param {*} payload 
 * @param {*} arn 
 */
function publishMsg(subject, message, arn) {
  return sns.publish({
    Subject: subject,
    Message: JSON.stringify(message),
    TopicArn: arn
  }).promise();
}

/**
 * This function will receive a posted vote, process and publish it to SNS.
 * @param {*} event 
 * @param {*} context 
 */
module.exports.ingest = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  //context.callbackWaitsForEmptyEventLoop = false;

  let body = {};
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    console.log(error.stack);
    return { 
      statusCode: 400,
      body: JSON.stringify({
        message: 'Bad body'
      })
    };
  }
  let arn = process.env.VIET_SOUL_SNS_ARN;
  let subject = 'Post a new vote';
  let { categoryId, voteeId, userId, email } = body;
  
  let message;
  try {
    message = { 
      eventType: 'NEW_VOTE',
      userId, email,
      payload: {
        categoryId, voteeId,
      }      
    }
    await publishMsg(subject, message, arn);
  } catch (error) {
    console.log(error.stack);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Cannot do vote',
        data: message
      }),
    };
  }
  console.log('Vote successfully!');
  console.log(message);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Vote successfully!',
      data: message
    })
  }
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};