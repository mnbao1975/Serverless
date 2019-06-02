//TODO: In order to save cost, we should have ONE function that will process eventType
// and call approriate functions for next actions.
'use strict';

let cachedDb = null;
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

  return MongoClient.connect(uri, { useNewUrlParser: true })
      .then(client => { cachedDb = client.db(dbName); return cachedDb; });
}
/**
 * 
 * @param {*} eventType 
 */
function functionMap(eventType) {
  const functionName = {
    'CREATED_DEVICE_TOKEN': 'store',
    'REMOVED_DEVICE_TOKEN': 'remove',
  }
  return Promise.resolve(functionName[eventType]);
} 

function removeTokens(snsMessage) {
  console.log(`snsMessage: ${snsMessage}`);
  return;
}
/**
 * This function will listen to the topic "Notification-Device-Token" to insert/update
 * information a device Id such token, SNS endpoint, etc.
 * @param {*} event 
 * @param {*} context 
 */
module.exports.store = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  context.callbackWaitsForEmptyEventLoop = false;

  let message;
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }

  console.log('From SNS:', message);
  let db;
  let result;

  let uri = `mongodb+srv://${process.env.MONGO_URI}`;
  let { userId, role, platform, phoneNum, icNum, deviceId } = message;
  let deviceToken = message.payload.deviceToken;
  let snsEndpoint = message.payload.snsEndpoint;
  try {
    db = await connectDB(uri, process.env.MONGO_DB);
    if(message.eventType === 'CREATED_DEVICE_TOKEN') {
      // result = await db.collection('device_tokens').insertOne({
      //   userId, role, platform, phoneNum, icNum, deviceId, deviceToken, snsEndpoint
      // });
      result = await db.collection('device_tokens').updateOne(
        { userId, deviceId },
        { $set: { userId, role, platform, phoneNum, icNum, deviceId, deviceToken, snsEndpoint } },
        { upsert: true }
      );
    }
    else if (message.eventType === 'UPDATED_DEVICE_TOKEN') {
      result = await db.collection('device_tokens').updateOne(
        { deviceId: message.deviceId },
        { $set: { deviceToken, snsEndpoint } }
      );
    }
  } catch (err) {
    console.log(err.stack);
    return { message: 'error'};
  }

  console.log('Store token sucessfully');
  return result.n;
};
/**
 * Remove device tokens of userId
 * @param {} event 
 * @param {*} context 
 */
module.exports.remove = async (event, context) => {
  //console.log('Received event:', JSON.stringify(event, null, 2));
  context.callbackWaitsForEmptyEventLoop = false;

  let message;
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }

  console.log('From SNS:', message);
  let db;
  let result;

  
  let { eventType, userId } = message;  
  if(eventType !== 'REMOVED_DEVICE_TOKEN') {
    console.log('Do nothing');
    return {};
  }

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
};
