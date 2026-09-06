"""Run: python -m backend.itinerary.smoke_test (no application or database needed)."""
from dotenv import load_dotenv
from .bedrock import call_claude
from .planner import Problem


def main():
    load_dotenv()
    try:
        reply = call_claude("Follow the user's instruction exactly.", "Reply with exactly: BEDROCK_OK", max_tokens=32)
        if reply.strip() != "BEDROCK_OK":
            raise Problem("Bedrock responded, but the smoke-test response was unexpected.")
        print("BEDROCK_OK: Claude access works.")
        return 0
    except Problem as exc:
        print(f"Setup check failed: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
