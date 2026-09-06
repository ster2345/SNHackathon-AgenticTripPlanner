"""One Claude adapter shared by the smoke test and itinerary agent."""
import os
from .planner import Problem
from .limits import remaining


def call_claude(system, message, max_tokens=3000):
    import boto3
    from botocore.config import Config
    from botocore.exceptions import BotoCoreError, ClientError, ReadTimeoutError, ConnectTimeoutError
    if len((system + message).encode('utf-8')) > 24000:
        raise Problem("Planner input exceeds the 24 KB limit. Shorten preferences or use a smaller trip; no request was sent.", 413)
    if remaining() < 5:
        raise Problem("Planning timed out after 60 seconds. Your saved itinerary has not changed.", 504)
    model_id = os.environ.get("BEDROCK_MODEL_ID", "").strip()
    if not model_id:
        raise Problem("Set BEDROCK_MODEL_ID to your enabled Claude model or inference profile ID.", 503)
    try:
        client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION") or "ap-southeast-1",
                              config=Config(connect_timeout=3, read_timeout=min(20, (remaining() - 5) / 2),
                                            retries={"mode": "standard", "total_max_attempts": 2}))
        result = client.converse(modelId=model_id, system=[{"text": system}],
                                 messages=[{"role": "user", "content": [{"text": message}]}],
                                 inferenceConfig={"maxTokens": min(max_tokens, 3000)})
        if remaining() <= 0:
            raise Problem("Planning timed out after 60 seconds. Your saved itinerary has not changed.", 504)
        if result.get("stopReason") != "end_turn":
            raise Problem("Claude response was incomplete or blocked (output is capped at 3,000 tokens). Try a shorter trip.", 502)
        return "".join(block.get("text", "") for block in result["output"]["message"]["content"])
    except (BotoCoreError, ClientError) as exc:
        if isinstance(exc, (ReadTimeoutError, ConnectTimeoutError)):
            raise Problem("Bedrock timed out after limited attempts. Wait before retrying. Your saved itinerary has not changed.", 504) from exc
        code = getattr(exc, "response", {}).get("Error", {}).get("Code", type(exc).__name__)
        if code == "ThrottlingException":
            raise Problem(
                "Bedrock is throttling this model after limited automatic retries. "
                "Wait at least 60 seconds before trying again. If it persists, check this "
                "model's request/token quotas in AWS Service Quotas for the configured region. "
                "Your saved itinerary has not changed.", 429) from exc
        raise Problem(f"Bedrock request failed ({code}). Check AWS credentials, model access, region, and IAM.", 503) from exc
