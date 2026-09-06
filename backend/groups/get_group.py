from backend.shared.db import get_groups_table
from backend.shared.responses import (
    success,
    bad_request,
    not_found,
    server_error,
)


def lambda_handler(event, context):
    path_parameters = event.get("pathParameters") or {}

    group_id = path_parameters.get("group_id")

    if not group_id:
        return bad_request("Group ID is required.")

    try:
        table = get_groups_table()

        response = table.get_item(
            Key={
                "group_id": group_id
            }
        )

        group = response.get("Item")

        if not group:
            return not_found("Group not found.")

        return success(group)

    except Exception as error:
        print(error)
        return server_error()