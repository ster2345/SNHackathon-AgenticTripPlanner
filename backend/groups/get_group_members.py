from boto3.dynamodb.conditions import Key

from backend.shared.db import (
    get_group_members_table,
    get_users_table,
)
from backend.shared.responses import (
    success,
    bad_request,
    server_error,
)


def lambda_handler(event, context):
    path_parameters = event.get("pathParameters") or {}

    group_id = path_parameters.get("group_id")

    if not group_id:
        return bad_request("Group ID is required.")

    try:
        members_table = get_group_members_table()
        users_table = get_users_table()

        response = members_table.query(
            KeyConditionExpression=Key("group_id").eq(group_id)
        )

        memberships = response.get("Items", [])

        members = []

        for membership in memberships:
            user_response = users_table.get_item(
                Key={
                    "user_id": membership["user_id"]
                }
            )

            user = user_response.get("Item")

            if user:
                members.append(user)

        return success({
            "group_id": group_id,
            "members": members
        })

    except Exception as error:
        print(error)
        return server_error()