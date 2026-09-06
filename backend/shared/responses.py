import json
from decimal import Decimal


def json_serializer(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)

    raise TypeError(f"Type {type(value)} is not JSON serializable")


def make_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps(body, default=json_serializer)
    }


def success(body):
    return make_response(200, body)


def created(body):
    return make_response(201, body)


def bad_request(message):
    return make_response(400, {"error": message})


def unauthorized(message="Unauthorized"):
    return make_response(401, {"error": message})


def not_found(message="Not found"):
    return make_response(404, {"error": message})


def conflict(message):
    return make_response(409, {"error": message})


def server_error(message="Internal server error"):
    return make_response(500, {"error": message})