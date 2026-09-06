from backend.shared.auth import get_user_id, get_user_email
from backend.shared.db import get_users_table
from backend.shared.request import get_json_body
from backend.shared.responses import (
    created,
    bad_request,
    unauthorized,
    conflict,
    server_error,
)

from botocore.exceptions import ClientError


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return unauthorized()

    body = get_json_body(event)

    name = body.get("name")

    if not name:
        return bad_request("Name is required.")

    profile = {
        "user_id": user_id,
        "name": name,
        "email": get_user_email(event) or body.get("email", ""),
        "dietary_needs": body.get("dietary_needs", ""),
        "blacklist_activities": body.get("blacklist_activities", ""),
        "blacklist_food": body.get("blacklist_food", ""),
    }

    if body.get("age") is not None:
        profile["age"] = body["age"]

    try:
        table = get_users_table()

        table.put_item(
            Item=profile,
            ConditionExpression="attribute_not_exists(user_id)"
        )

        return created(profile)

    except ClientError as error:
        error_code = error.response["Error"]["Code"]

        if error_code == "ConditionalCheckFailedException":
            return conflict("Profile already exists.")

        print(error)
        return server_error()

    except Exception as error:
        print(error)
        return server_error()