import os
import json
import boto3
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

print("AWS_ACCESS_KEY_ID:", os.getenv("AWS_ACCESS_KEY_ID")[:6] + "..." if os.getenv("AWS_ACCESS_KEY_ID") else "None")
print("AWS_DEFAULT_REGION:", os.getenv("AWS_DEFAULT_REGION"))

client = boto3.client(
    service_name="bedrock-runtime",
    region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

try:
    print("Testing Amazon Bedrock invocation...")
    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 150,
        "messages": [{"role": "user", "content": "Hello, are you operational?"}],
        "temperature": 0.2
    })
    candidates = [
        "apac.anthropic.claude-sonnet-4-5-20250929-v1:0",
        "anthropic.claude-3-haiku-20240307-v1:0",
        "apac.anthropic.claude-3-5-sonnet-20240620-v1:0",
        "anthropic.claude-3-5-sonnet-20240620-v1:0"
    ]
    for mid in candidates:
        try:
            print(f"Trying model: {mid}...")
            response = client.invoke_model(
                modelId=mid,
                contentType="application/json",
                accept="application/json",
                body=body
            )
            res_json = json.loads(response.get("body").read().decode("utf-8"))
            print(f"✅ SUCCESS on {mid}! Response: {res_json.get('content', [{}])[0].get('text')[:100]}...")
            break
        except Exception as err:
            print(f"❌ Failed on {mid}: {err}")
except Exception as e:
    print("Bedrock test error:", type(e).__name__, e)
