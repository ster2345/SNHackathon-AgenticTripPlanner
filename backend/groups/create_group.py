import secrets
import string
import uuid
from datetime import datetime, timezone

from backend.shared.auth import get_user_id
from backend.shared.db import (
    get_groups_table,
    get_group_members_table,
)
from backend.shared.request import get_json_body
from backend.shared.responses import (
    created,
    bad_request,
    unauthorized,
    server_error,
)


def generate_invite_code(length=8):
    characters = string.ascii_uppercase + string.digits

    return "".join(
        secrets.choice(characters)
        for _ in range(length)
    )


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return unauthorized()

    body = get_json_body(event)

    trip_name = body.get("trip_name")

    if not trip_name:
        return bad_request("Trip name is required.")

    group_id = str(uuid.uuid4())
    invite_code = generate_invite_code()

    group = {
        "group_id": group_id,
        "trip_name": trip_name,
        "destination": body.get("destination", ""),
        "start_date": body.get("start_date", ""),
        "end_date": body.get("end_date", ""),
        "invite_code": invite_code,
        "organizer_user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    membership = {
        "group_id": group_id,
        "user_id": user_id,
        "joined_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        groups_table = get_groups_table()
        members_table = get_group_members_table()

        groups_table.put_item(Item=group)

        members_table.put_item(Item=membership)

        return created(group)

    except Exception as error:
        print(error)
        return server_error()