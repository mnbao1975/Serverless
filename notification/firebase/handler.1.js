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
 */
async function storeToken(message) {
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
    result = await ref.set({
      userId, role, platform, phoneNum, icNum, deviceId, deviceToken, snsEndpoint
    });
  }
  catch (err) {
    console.log(err.stack);
    return { message: "Cannot update Firebase"};   
  }
  
  console.log("Firebase, succeed!:", result);
  return { "message": "succeed!" };
}
/**
 * 
 */
async function updateToken(message) {
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
    result = await ref.update({
      deviceToken, snsEndpoint
    });
  }
  catch (err) {
    console.log(err.stack);
    return { message: "Cannot update Firebase"};   
  }
  
  console.log("Firebase, succeed!:", result);
  return { "message": "succeed!" };
}
/**
 * 
 */
async function cleanUsersByDeviceId(message) {
  let users = message.payload.users;  
  console.log('cleanUsersByDeviceId');
  console.log(message);

  let admin;
  try {
    admin = await connectDB();  
  } catch (err) {
    console.log(err.stack);
    return { message: 'Cannot connect to Firebase'};
  }

  const { createHash } = require("crypto");

  users.forEach(async function(user) {
    const firebaseId = createHash("md5")
    .update(user.userId + user.role)
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
  });

  
  console.log("Firebase, succeed!:");
  return { "message": "succeed!" };
}
/**
 * 
 * @param {*} message 
 */
async function removeToken(message) {
  let { eventType, userId, role } = message;  
  console.log(message);

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
    case 'CLEANED_USERS_BY_DEVICE_ID': cleanUsersByDeviceId(message); break;
  }
};
