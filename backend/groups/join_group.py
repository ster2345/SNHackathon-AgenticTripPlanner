from datetime import datetime, timezone

from boto3.dynamodb.conditions import Attr
from botocore.exceptions import ClientError

from backend.shared.auth import get_user_id
from backend.shared.db import (
    get_groups_table,
    get_group_members_table,
)
from backend.shared.request import get_json_body
from backend.shared.responses import (
    success,
    bad_request,
    unauthorized,
    not_found,
    server_error,
)


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return unauthorized()

    body = get_json_body(event)

    invite_code = body.get("invite_code", "").strip().upper()

    if not invite_code:
        return bad_request("Invite code is required.")

    try:
        groups_table = get_groups_table()
        members_table = get_group_members_table()

        response = groups_table.scan(
            FilterExpression=Attr("invite_code").eq(invite_code)
        )

        groups = response.get("Items", [])

        if not groups:
            return not_found("Invalid invite code.")

        group = groups[0]

        membership = {
            "group_id": group["group_id"],
            "user_id": user_id,
            "joined_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            members_table.put_item(
                Item=membership,
                ConditionExpression=(
                    "attribute_not_exists(group_id) "
                    "AND attribute_not_exists(user_id)"
                ),
            )

        except ClientError as error:
            if (
                error.response["Error"]["Code"]
                != "ConditionalCheckFailedException"
            ):
                raise

            # Already a member — this is fine.
            pass

        return success(group)

    except Exception as error:
        print(error)
        return server_error()