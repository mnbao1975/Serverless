This is the project for ELLE style award - Viet Soul

There are 2 parts: Fontend and Backend.

I. The fontend will be run on S3.


II. The backend will be build on Lambda. In general, here is how the requests flow through the system.

POST /vote -> AGW -> ingest vote -> SNS -> store a vote
                                        -> aggregate votes

GET /votes/{} <- AGW <- aggregate votes 

1. Validating vote requests function (backend/ingest-vote):
Receive and valide vote, then publish the vote to SNS

2. Storing vote function (backend/store-vote):
Listening to a topic ARN for getting a new vote. Then, store it into db

3. Aggregating vote function (backend/aggregate-vote):
Listening to a topic ARN for getting a new vote. Then, add up the number of votes for each person

III. Deployment
1. Fontend

2. Backend
Run the following command inside each service folder.
$ sls deploy -s dev