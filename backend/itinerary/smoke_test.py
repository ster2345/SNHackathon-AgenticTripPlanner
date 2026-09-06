"""Run: python -m backend.itinerary.smoke_test (no application or database needed)."""
import os
from dotenv import load_dotenv
from .bedrock import call_claude
from .planner import Problem


def main():
    load_dotenv()
    print("Region:", os.environ.get("AWS_REGION") or "ap-southeast-1")
    print("Model:", os.environ.get("BEDROCK_MODEL_ID") or "(not configured)")
    try:
        reply = call_claude("Follow the user's instruction exactly.", "Reply with exactly: BEDROCK_OK", max_tokens=32)
        if reply.strip() != "BEDROCK_OK":
            raise Problem("Bedrock responded, but the smoke-test response was unexpected.")
        print("BEDROCK_OK: Claude access works.")
        return 0
    except Problem as exc:
        print(f"Setup check failed: {exc}")
        # Diagnostics belong in this local setup command, not the public API response.
        aws_error = getattr(exc.__cause__, "response", {}).get("Error", {})
        if aws_error.get("Message"):
            print("AWS detail:", aws_error["Message"])
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
