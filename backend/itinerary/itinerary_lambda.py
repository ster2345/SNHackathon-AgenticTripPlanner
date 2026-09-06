"""API Gateway proxy handler. Requires a Cognito/JWT authorizer (sub = user_id)."""
import base64
import json
import logging
import os
import re
from decimal import Decimal
from .bedrock import call_claude
from .planner import Problem
from .service import ItineraryService
from .storage import DynamoStore

log = logging.getLogger(__name__)


def dispatch(service, method, path, uid, body):
    match = re.fullmatch(r"/groups/([^/]+)/(preferences|itinerary|itinerary/recalculate)", path)
    if not match:
        raise Problem("Unknown route.", 404)
    gid, action = match.groups()
    if method == "GET" and action in ("preferences", "itinerary"):
        return service.state(gid, uid)
    if method == "PUT" and action == "preferences":
        return service.save_preferences(gid, uid, body)
    if method == "POST" and action.startswith("itinerary"):
        return service.plan(gid, uid, action.endswith("/recalculate"), body.get("reason", ""))
    raise Problem("Method not allowed.", 405)


def lambda_handler(event, context):
    method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod", "")
    headers = {"Content-Type": "application/json", "Cache-Control": "no-store"}
    if os.environ.get("FRONTEND_ORIGIN"):
        headers.update({"Access-Control-Allow-Origin": os.environ["FRONTEND_ORIGIN"],
                        "Access-Control-Allow-Headers": "Authorization,Content-Type",
                        "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS"})
    try:
        if method == "OPTIONS":
            return {"statusCode": 204, "headers": headers, "body": ""}
        authorizer = event.get("requestContext", {}).get("authorizer", {})
        claims = authorizer.get("jwt", {}).get("claims") or authorizer.get("claims", {})
        uid = claims.get("sub")
        if not uid:
            raise Problem("Sign in before accessing this group.", 401)
        raw = event.get("body") or "{}"
        if event.get("isBase64Encoded"):
            raw = base64.b64decode(raw, validate=True).decode("utf-8")
        if len(raw) > 20000:
            raise Problem("Request is too large.", 413)
        body = json.loads(raw)
        if not isinstance(body, dict):
            raise Problem("Request body must be a JSON object.")
        service = ItineraryService(DynamoStore(), call_claude)
        result = dispatch(service, method, event.get("rawPath") or event.get("path", ""), uid, body)
        status = 200
    except (ValueError, UnicodeError):
        status, result = 400, {"error": "Request body must contain valid JSON."}
    except Problem as exc:
        status, result = exc.status, {"error": str(exc)}
    except Exception:
        log.exception("Itinerary request failed")
        status, result = 500, {"error": "Itinerary service failed. Check the Lambda logs."}
    return {"statusCode": status, "headers": headers,
            "body": json.dumps(result, default=lambda x: float(x) if isinstance(x, Decimal) else str(x))}
