'use strict';

let cacheDb = null;
/**
 * Try to reuse cached database instance
 */
function connectDB() {
  if (cacheDb) {    
    console.log('=> Using cached database instance');
  }
  else {
    cacheDb = require("firebase-admin");
    const serviceAccount = require('./firebase.json');
    const databaseURL = "https://ghealth-162308.firebaseio.com/";

    cacheDb.initializeApp({
      credential: cacheDb.credential.cert(serviceAccount),
      databaseURL: databaseURL,
    });
  }
  
  return Promise.resolve(cacheDb);
}
/**
 * 
 * @param {*} event 
 * @param {*} context 
 */
module.exports.store = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let message;  
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }

  let admin;
  try {
    admin = await connectDB();  
  } catch (err) {
    console.log(err.stack);
    return { message: 'Cannot connect to Firebase'};
  }

  let { userId, role, platform, phoneNum, icNum, deviceId } = message;
  let deviceToken = message.payload.deviceToken;
  let snsEndpoint = message.payload.snsEndpoint;

  const { createHash } = require("crypto");
  const firebaseId = createHash("md5")
    .update(userId + role)
    .digest("hex");

  const ref = admin.database().ref(`/devices/${firebaseId}/${deviceId}`);
  
  let result;
  try {
    if(message.eventType === 'CREATED_DEVICE_TOKEN') {
      result = await ref.set({
        userId, role, platform, phoneNum, icNum, deviceId, deviceToken, snsEndpoint
      });
    }
    else if (message.eventType === 'UPDATED_DEVICE_TOKEN') {
      result = await ref.update({
        deviceToken, snsEndpoint
      });
    }
  }
  catch (err) {
    console.log(err.stack);
    return { message: "Cannot update Firebase"};   
  }
  
  console.log("Firebase, succeed!:", result);
  return { "message": "succeed!" };
};
/**
 * 
 * @param {*} event 
 * @param {*} context 
 */
module.exports.remove = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  let message;  
  try {
    message = JSON.parse(event.Records[0].Sns.Message);
  } catch (err) {
    console.log(err.stack);
    return { message: 'Bad message'};
  }

  let { eventType, userId, role } = message;  
  console.log(message);
  if(eventType !== 'REMOVED_DEVICE_TOKEN') {
    console.log('Do nothing');
    return {};
  }

  let admin;
  try {
    admin = await connectDB();  
  } catch (err) {
    console.log(err.stack);
    return { message: 'Cannot connect to Firebase'};
  }

  const { createHash } = require("crypto");
  const firebaseId = createHash("md5")
    .update(userId + role)
    .digest("hex");
  
  const ref = admin.database().ref(`/devices/${firebaseId}`);
  
  let result;
  try {
    result = await ref.remove();
    console.log(`Path: /devices/${firebaseId}`);  
  }
  catch (err) {
    console.log(err.stack);
    return { message: "Cannot update Firebase"};   
  }
  
  console.log("Firebase, succeed!:", result);
  return { "message": "succeed!" };
};
