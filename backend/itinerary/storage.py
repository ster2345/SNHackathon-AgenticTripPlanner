"""DynamoDB adapter. All primary keys are strings; see docs/person-b.md."""
import json
import os
from decimal import Decimal
from .planner import Problem


class DynamoStore:
    def __init__(self):
        import boto3
        self.db = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION") or "ap-southeast-1")

    def table(self, key, default):
        return self.db.Table(os.environ.get(key) or default)

    def group(self, gid):
        item = self.table("GROUPS_TABLE", "Groups").get_item(Key={"group_id": gid}, ConsistentRead=True).get("Item")
        if not item:
            raise Problem("Group not found.", 404)
        return item

    def members(self, gid):
        from boto3.dynamodb.conditions import Key
        table = self.table("GROUP_MEMBERS_TABLE", "GroupMembers")
        args = {"KeyConditionExpression": Key("group_id").eq(gid), "ConsistentRead": True}
        items = []
        while True:
            page = table.query(**args)
            items.extend(page.get("Items", []))
            if not page.get("LastEvaluatedKey"):
                return items
            args["ExclusiveStartKey"] = page["LastEvaluatedKey"]

    def users(self, members):
        table = self.table("USERS_TABLE", "Users")
        return {m["user_id"]: table.get_item(Key={"user_id": m["user_id"]}, ConsistentRead=True).get("Item") for m in members}

    def save_preferences(self, gid, uid, prefs):
        from botocore.exceptions import ClientError
        try:
            self.table("GROUP_MEMBERS_TABLE", "GroupMembers").update_item(
                Key={"group_id": gid, "user_id": uid},
                UpdateExpression="SET preferences = :p",
                ConditionExpression="attribute_exists(user_id) AND (attribute_not_exists(#s) OR #s = :active)",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":p": prefs, ":active": "active"})
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise Problem("Only active group members can save preferences.", 403) from exc
            raise

    def itinerary(self, gid):
        item = self.table("ITINERARY_TABLE", "Itinerary").get_item(Key={"group_id": gid}, ConsistentRead=True).get("Item")
        # Model JSON must use ordinary JSON numbers, not DynamoDB Decimals.
        return json.loads(json.dumps(item, default=lambda v: int(v) if v == int(v) else float(v))) if item else None

    def save_itinerary(self, gid, record, expected_version):
        from botocore.exceptions import ClientError
        args = {"Item": json.loads(json.dumps(record), parse_float=Decimal),
                "ConditionExpression": "attribute_not_exists(group_id)"}
        if expected_version:
            args.update(ConditionExpression="version = :v", ExpressionAttributeValues={":v": expected_version})
        try:
            self.table("ITINERARY_TABLE", "Itinerary").put_item(**args)
        except ClientError as exc:
            if exc.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise Problem("Another itinerary was saved while generating. Refresh and retry.", 409) from exc
            raise
