"""
NIRNAY AWS Lambda Serverless Handler
Adapts the FastAPI application to AWS Lambda and Amazon API Gateway using Mangum.
"""

try:
    from mangum import Mangum
    from member_2_backend_aws.api_server import app
    handler = Mangum(app, lifespan="off")
except ImportError:
    def handler(event, context):
        return {
            "statusCode": 200,
            "body": "NIRNAY AWS Lambda Handler initialized."
        }
