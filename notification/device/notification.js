'use strict';

let AWS = require('aws-sdk');  
AWS.config.region = 'ap-southeast-1';

let sns = new AWS.SNS();
/**
 * This function will listen to the topic "Notification-Direct-Message" and send a push notification
 * to the snsEndpoint.
 * The message must be formated as following:
 * iOS:
 * 
 * {
 *  "platform": "ios",
 *  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/APNS/gHealth-Patient/8513d043-46c6-3ba6-8140-69d0f70e830b",
 *  "payload": {
 *    "aps": { "alert": { "title": "Hello", "body": "Hello there!" }, "badge": 1, "sound": "default" },
 *    "ext": {"f1": "field 1", "f2": "field 2"}
 *  }
 * }
 * 
 * Android:
 * 
 * {
 *  "platform": "android",
 *  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/GCM/gHealth-Patient/8513d043-46c6-3ba6-8140-69d0f70e830b",
 *  "payload": {
 *   "data": {
 *     "notification" : {
 *       "alert" : "This is alert field",
 *       "title" : "Title field",
 *       "body"  : "Body field",
 *       "sound" : "default"
 *     },
 *     "ext": {"f1": "field 1", "f2": "field 2"}      
 *   }    
 * }
 * }
 *
 * @param {*} event 
 * @param {*} context 
 */
module.exports.publish = async (event, context) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  let message;
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }
  console.log('From SNS:', message);

  let { platform, snsEndpoint, payload } = message;
  
  let payloadKey = 'no_key';
  if (platform === 'ios') {
    payloadKey = 'APNS';
  } 
  else if (platform === 'android') {
    payloadKey = 'GCM';
  }

  let snsMessage = {};
  snsMessage[payloadKey] = JSON.stringify(payload);
  
  let snsParams = {
    Message: JSON.stringify(snsMessage),
    TargetArn: snsEndpoint,
    MessageStructure: 'json'
  };

  console.log('snsMessage: ', snsMessage);
  
  //return {message: 'done'};
  return await sns.publish(snsParams).promise();

};
