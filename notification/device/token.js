'use strict';

var AWS = require('aws-sdk');  
AWS.config.region = 'ap-southeast-1';

let sns = new AWS.SNS();

/**
 * This function will create a SNS platform enpoint for a device token. 
 * @param {*} deviceToken 
 */
function createSNSEndpoint(deviceToken, platform, role) {
  let appArn;
  if (platform === 'ios') {
    if (role === 'doctor') {
      appArn = process.env.IOS_DOCTOR_PLATFORM_APP_ARN;  
    }
    else {
      appArn = process.env.IOS_PATIENT_PLATFORM_APP_ARN;
    }    
  }
  else {
    if (role === 'doctor') { 
      appArn = process.env.ANDROID_DOCTOR_PLATFORM_APP_ARN;  
    }
    else {
      appArn = process.env.ANDROID_PATIENT_PLATFORM_APP_ARN;
    }    
  }

  let params = {
    PlatformApplicationArn: appArn,
    Token: deviceToken
  };

  console.log(`createSNSEndpoint: ${platform}, ${role}`);
  console.log(`createSNSEndpoint: ${params}`);
  return sns.createPlatformEndpoint(params).promise();
}
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
 * This function will create a new SNS enpoint for a device token.
 * Then, it will send out a message as an event to a topic for others could use it.
 * @param {*} event 
 * @param {*} context 
 */
module.exports.create = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  //TODO: apply validating body data including try/catch
  let body = JSON.parse(event.body);
  let arn = process.env.TOKEN_TOPIC_ARN;
  let subject = 'create device token';
  let { eventType, phoneNum, icNum, platform, deviceToken } = body;

  let role = event.headers["role"];
  let userId = event.headers["user-id"];
  let deviceId = event.headers["device-id"];
  
  let snsEndpoint;
  let message;
  try {
    snsEndpoint = await createSNSEndpoint(deviceToken, platform, role);
    message = { eventType, userId, role, phoneNum, icNum, deviceId, platform,
      payload: {
        deviceToken,        
        snsEndpoint: snsEndpoint.EndpointArn
      }      
    }
    await publishMsg(subject, message, arn);
  }
  catch (err) {
    console.log(err.stack);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Cannot create device token',
        data: message
      }),
    };
  }
  console.log('The device token created');
  console.log(message);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'The device token created successfully!',
      data: message
    })
  }
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
/**
 * This function will update changed device token with a new SNS enpoint.
 * Then, it will send out a message as an event to a topic for others could use it.
 * @param {*} event 
 * @param {*} context 
 */
module.exports.update = async (event, context) => {
  //TODO: apply validating body data including try/catch
  let body = JSON.parse(event.body);
  let arn = process.env.TOKEN_TOPIC_ARN;
  let subject = 'update device token';

  let { eventType, phoneNum, icNum, platform, deviceToken, snsEndpoint } = body;

  let role = event.headers["role"];
  let userId = event.headers["user-id"];
  let deviceId = event.headers["device-id"];

  let newSnsEndpoint;
  let message;
  try {
    await sns.deleteEndpoint({ EndpointArn: snsEndpoint }).promise();
    newSnsEndpoint = await createSNSEndpoint(deviceToken, platform, role);
    message = { eventType, userId, role, phoneNum, icNum, deviceId,
      payload: {
        deviceToken,
        snsEndpoint: newSnsEndpoint.EndpointArn
      }
    }
    await publishMsg(subject, message, arn);
  }
  catch (err) {
    console.log(err.stack);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Cannot update device token!',
        data: message
      }),
    };
  }
  console.log('The device token updated');
  console.log(message);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'The device token updated successfully!',
      data: message
    })
  }  
};
/**
 * This endpoint will remove all device tokens of a user
 * @param {*} event 
 * @param {*} context 
 */
module.exports.remove = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  // //TODO: apply validating body data including try/catch
  let body = JSON.parse(event.body);
  let arn = process.env.TOKEN_TOPIC_ARN;
  let subject = 'Remove device tokens';
  let eventType = 'REMOVED_DEVICE_TOKEN';

  let role = event.headers["role"];
  let userId = event.headers["user-id"];
  
  let snsEndpoint;
  let message;
  try {
    message = { eventType, userId, role,
      payload: {
      }
    }
    await publishMsg(subject, message, arn);
  }
  catch (err) {
    console.log(err.stack);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Cannot publish message for removing device tokens',
        data: message
      }),
    };
  }
  console.log('The device tokens removed');
  console.log(message);
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'The device tokens removed successfully!',
      data: message
    })
  }
  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
