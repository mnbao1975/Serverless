/**
 * 
 * @param {*} endpointArn 
 */
function subscribeDeviceToTopic(endpointArn) {
  const params = {
    Protocol: 'application',
    TopicArn: process.env.BROADCAST_TOPIC_ARN,
    Endpoint: endpointArn
  };

  return sns.subscribe(params).promise();
}

// My device token and endpoint of patient.
// 84c58a7ab677cefcfab4c021afda984db263fc8c7f29a3a55fbf467fb2347348
// arn:aws:sns:ap-southeast-1:336087288634:endpoint/APNS/gHealth-Patient/8513d043-46c6-3ba6-8140-69d0f70e830b

//API Keys:
//dev-key: RBWNgtUUSR1j9oFk7sfYsnE6lClnAZL6axUcHeZ9

// Payloads for test send push notification to iOS endpoint:
{
  "platform": "ios",
  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/APNS/gHealth-Patient/8513d043-46c6-3ba6-8140-69d0f70e830b",
  "payload": {
    "aps": { "alert": { "title": "Hello", "body": "Hello there!" }, "badge": 1, "sound": "default" },    
    "ext": {"f1": "field 1", "f2": "field 2"}
  }
}

{
  "platform": "android",
  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/GCM/gHealth-Patient/64424be7-eaaa-3d41-992a-3edc5a9e0b72",
  "payload": {
    "data": {
      "notification" : {
        "alert" : "This is alert field",
        "title" : "Title field",
        "body"  : "Body field",
        "sound" : "default"
      },
      "ext": {"f1": "field 1", "f2": "field 2"}      
    }    
  }
}

{
  "_id": {
    "$oid": "5b939904290c8c13e4747415"
  },
  "userId": "baonguyen",
  "role": "patient",
  "platform": "ios",
  "phoneNum": "84908448241",
  "icNum": "022806580",
  "deviceId": "CC8F35CF-2E82-44FE-A827-3667E26A6F5D",
  "deviceToken": "84c58a7ab677cefcfab4c021afda984db263fc8c7f29a3a55fbf467fb2347348",
  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/APNS/gHealth-Patient/8513d043-46c6-3ba6-8140-69d0f70e830b"
}

//------
{
  "_id": {
    "$oid": "5b948d2a31eb8f42a8fc47af"
  },
  "userId": "thanh",
  "role": "patient",
  "platform": "android",
  "phoneNum": "84908448240",
  "icNum": "022806581",
  "deviceId": "23456",
  "deviceToken": "cZ7CLV_safI:APA91bHbH1F_UIDeev59C-Y__3prw5kVQJMkJxHQE9RB9Gwlr6hpRK7_kbk45--Yptlifs3rHvwe9eHHWbagf2mF07RmX2q6_5iW33Qdzp7DtWG4Z9gM6cOF2dn0cyx14GVYQjeIe3Rm",
  "snsEndpoint": "arn:aws:sns:ap-southeast-1:336087288634:endpoint/GCM/gHealth-Patient/64424be7-eaaa-3d41-992a-3edc5a9e0b72"
}