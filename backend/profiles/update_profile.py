from backend.shared.auth import get_user_id
from backend.shared.db import get_users_table
from backend.shared.request import get_json_body
from backend.shared.responses import (
    success,
    bad_request,
    unauthorized,
    not_found,
    server_error,
)


ALLOWED_FIELDS = {
    "name",
    "age",
    "dietary_needs",
    "blacklist_activities",
    "blacklist_food",
}


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return unauthorized()

    body = get_json_body(event)

    updates = {
        key: value
        for key, value in body.items()
        if key in ALLOWED_FIELDS
    }

    if not updates:
        return bad_request("No valid profile fields were provided.")

    try:
        table = get_users_table()

        existing = table.get_item(
            Key={"user_id": user_id}
        ).get("Item")

        if not existing:
            return not_found("Profile not found.")

        existing.update(updates)

        table.put_item(Item=existing)

        return success(existing)

    except Exception as error:
        print(error)
        return server_error()