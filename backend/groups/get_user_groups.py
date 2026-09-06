from boto3.dynamodb.conditions import Attr

from backend.shared.auth import get_user_id
from backend.shared.db import (
    get_group_members_table,
    get_groups_table,
)
from backend.shared.responses import (
    success,
    unauthorized,
    server_error,
)


def lambda_handler(event, context):
    user_id = get_user_id(event)

    if not user_id:
        return unauthorized()

    try:
        members_table = get_group_members_table()
        groups_table = get_groups_table()

        membership_response = members_table.scan(
            FilterExpression=Attr("user_id").eq(user_id)
        )

        memberships = membership_response.get("Items", [])

        groups = []

        for membership in memberships:
            response = groups_table.get_item(
                Key={
                    "group_id": membership["group_id"]
                }
            )

            group = response.get("Item")

            if group:
                groups.append(group)

        return success({
            "groups": groups
        })

    except Exception as error:
        print(error)
        return server_error()