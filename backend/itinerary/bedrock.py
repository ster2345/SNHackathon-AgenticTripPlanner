"""One Claude adapter shared by the smoke test and itinerary agent."""
import os
from .planner import Problem


def call_claude(system, message, max_tokens=6000):
    import boto3
    from botocore.config import Config
    from botocore.exceptions import BotoCoreError, ClientError
    model_id = os.environ.get("BEDROCK_MODEL_ID", "").strip()
    if not model_id:
        raise Problem("Set BEDROCK_MODEL_ID to your enabled Claude model or inference profile ID.", 503)
    try:
        client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION") or "ap-southeast-1",
                              config=Config(connect_timeout=10, read_timeout=120, retries={"max_attempts": 1}))
        result = client.converse(modelId=model_id, system=[{"text": system}],
                                 messages=[{"role": "user", "content": [{"text": message}]}],
                                 inferenceConfig={"maxTokens": max_tokens})
        if result.get("stopReason") != "end_turn":
            raise Problem("Claude response was incomplete or blocked. Try again with a smaller trip.", 502)
        return "".join(block.get("text", "") for block in result["output"]["message"]["content"])
    except (BotoCoreError, ClientError) as exc:
        code = getattr(exc, "response", {}).get("Error", {}).get("Code", type(exc).__name__)
        raise Problem(f"Bedrock request failed ({code}). Check AWS credentials, model access, region, and IAM.", 503) from exc
