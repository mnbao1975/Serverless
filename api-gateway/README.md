This is an example of how to use Serverless Framework for building RESTful API with custome domain.
If you haven't previously registered the domain with API Gateway, you'll need to register it. This is a one-time setup cost.

$ serverless create_domain -s <prod|dev>

For develoment mode:
$ sls deploy -s dev
GET https://dev-api.thefidelichain.com/products/hello

Fro production mode:
$ sls deploy -s prod
GET https://api.thefidelichain.com/products/hello


See also:
https://serverless.com/blog/api-gateway-multiple-services/

