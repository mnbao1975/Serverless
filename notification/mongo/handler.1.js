//TODO: In order to save cost, we should have ONE function that will process eventType
// and call approriate functions for next actions.
'use strict';

let AWS = require('aws-sdk');  
AWS.config.region = 'ap-southeast-1';

let sns = new AWS.SNS();
let cachedDb = null;
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
 * There is only ONE user can login and use device at time.
 * So, we need to delete all other users that registered with a certain device before.
 * In case the app call delete successfully deviceToken whenever it logs out, this function
 * is not necessary. But, we just do it for sure.
 * @param {*} deviceId 
 */
async function cleanUsersByDeviceId(deviceId) {
  let db;
  let users = [];

  let uri = `mongodb+srv://${process.env.MONGO_URI}`;
  try {
    db = await connectDB(uri, process.env.MONGO_DB);
    users = await db.collection('device_tokens')
      .find({ deviceId })
      .project({ userId: 1, role: 1, _id: 0 })
      .toArray();
    // There is no other user who using this deviceId
    if (users.length == 0) {
      return Promise.resolve(1);    
    }
    let eventType = 'CLEANED_USERS_BY_DEVICE_ID';
    let message = { 
      eventType, 
      deviceId,
      payload: { 
        users 
      }      
    }
    await publishMsg('clean up users by deviceId', message, process.env.TOKEN_TOPIC_ARN);
    await db.collection('device_tokens').deleteMany({ deviceId });
    //publishMsg();
  } catch (err) {
    console.log(err.stack);
    return Promise.resolve(0);
  }

  return Promise.resolve(1);  
}
/**
 * 
 * @param {*} uri 
 */
function connectDB(uri, dbName) {
  const MongoClient = require('mongodb').MongoClient;

  if (cachedDb && cachedDb.serverConfig.isConnected()) {    
      console.log('=> using cached database instance');
      return Promise.resolve(cachedDb);
  }
  console.log(`connectDB: ${uri}, ${dbName}`);
  return MongoClient.connect(uri, { useNewUrlParser: true })
      .then(client => { cachedDb = client.db(dbName); return cachedDb; });
}
/**
 * This function will listen to the topic "Notification-Device-Token" to insert/update
 * information a device Id such token, SNS endpoint, etc.
 */
async function storeToken(message) {
  //console.log('storeToken() - From SNS:', message);
  let db;
  let result;

  let uri = `mongodb+srv://${process.env.MONGO_URI}`;
  let { userId, role, platform, phoneNum, icNum, deviceId } = message;
  let deviceToken = message.payload.deviceToken;
  let snsEndpoint = message.payload.snsEndpoint;

  try {
    db = await connectDB(uri, process.env.MONGO_DB);
    //cleanUsersByDeviceId(deviceId);      
    console.log('db');
    console.log(db);
    result = await db.collection('device_tokens').updateOne(
      { userId, deviceId },
      { $set: { userId, role, platform, phoneNum, icNum, deviceId, deviceToken, snsEndpoint } },
      { upsert: true }
    );
  } catch (err) {
    console.log(err.stack);
    return { message: 'error'};
  }
  console.log('Store token sucessfully');
  return result.n;
}
/**
 * 
 * @param {*} message 
 */
async function updateToken(message) {
  console.log('From SNS:', message);
  let db;
  let result;

  let uri = `mongodb+srv://${process.env.MONGO_URI}`;
  let { userId, role, platform, phoneNum, icNum, deviceId } = message;
  let deviceToken = message.payload.deviceToken;
  let snsEndpoint = message.payload.snsEndpoint;
  try {
    db = await connectDB(uri, process.env.MONGO_DB);
    result = await db.collection('device_tokens').updateOne(
      { deviceId: message.deviceId },
      { $set: { deviceToken, snsEndpoint } }
    );
  } catch (err) {
    console.log(err.stack);
    return { message: 'error'};
  }

  console.log('Store token sucessfully');
  return result.n;
}
/**
 * Remove device tokens of userId
 */
async function removeToken(message) {
  console.log('From SNS:', message);
  let db;
  let result;

  let { eventType, userId } = message;  
  let uri = `mongodb+srv://${process.env.MONGO_URI}`;
  try {
    db = await connectDB(uri, process.env.MONGO_DB);    
    result = await db.collection('device_tokens').deleteMany(
      { userId }
    );
  } catch (err) {
    console.log(err.stack);
    return { message: 'error'};
  }

  console.log('Removed tokens sucessfully');
  return result.n;
}
/**
 * Process events and call approriate function
 */
module.exports.processEvents = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  context.callbackWaitsForEmptyEventLoop = false;
  
  let message;
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }

  switch (message.eventType) {    
    case 'CREATED_DEVICE_TOKEN': storeToken(message); break;
    case 'UPDATED_DEVICE_TOKEN': updateToken(message); break;
    case 'REMOVED_DEVICE_TOKEN': removeToken(message); break;    
  }
};
