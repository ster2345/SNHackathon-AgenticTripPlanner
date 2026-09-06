"""Offline AWS adapter tests; no credentials or network calls."""
import importlib.util
import os
import unittest
from decimal import Decimal
from unittest.mock import Mock, patch
from backend.itinerary.bedrock import call_claude
from backend.itinerary.planner import Problem
from backend.itinerary.storage import DynamoStore


@unittest.skipUnless(importlib.util.find_spec("boto3"), "Install requirements.txt for AWS adapter tests")
class AwsAdapterTests(unittest.TestCase):
    def test_converse_response_and_truncation(self):
        client = Mock()
        client.converse.return_value = {"stopReason": "end_turn", "output": {"message": {"content": [{"text": "OK"}]}}}
        with patch.dict(os.environ, {"BEDROCK_MODEL_ID": "test-model"}), patch("boto3.client", return_value=client):
            self.assertEqual(call_claude("system", "input"), "OK")
            self.assertEqual(client.converse.call_args.kwargs["modelId"], "test-model")
            client.converse.return_value["stopReason"] = "max_tokens"
            with self.assertRaises(Problem) as caught:
                call_claude("system", "input")
            self.assertEqual(caught.exception.status, 502)

    def test_members_pagination_including_empty_page(self):
        store = object.__new__(DynamoStore)
        table = Mock()
        store.table = Mock(return_value=table)
        table.query.side_effect = [{"Items": [], "LastEvaluatedKey": {"group_id": "g", "user_id": "a"}},
                                   {"Items": [{"user_id": "b"}]}]
        self.assertEqual(store.members("g"), [{"user_id": "b"}])
        self.assertEqual(table.query.call_args.kwargs["ExclusiveStartKey"]["user_id"], "a")

    def test_preferences_do_not_upsert_missing_members(self):
        from botocore.exceptions import ClientError
        store = object.__new__(DynamoStore)
        table = Mock()
        store.table = Mock(return_value=table)
        table.update_item.side_effect = ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "UpdateItem")
        with self.assertRaises(Problem) as caught:
            store.save_preferences("g", "u", {})
        self.assertEqual(caught.exception.status, 403)
        self.assertIn("attribute_exists(user_id)", table.update_item.call_args.kwargs["ConditionExpression"])

    def test_decimal_conversion_and_optimistic_save(self):
        from botocore.exceptions import ClientError
        store = object.__new__(DynamoStore)
        table = Mock()
        store.table = Mock(return_value=table)
        store.save_itinerary("g", {"group_id": "g", "cost": 3.25}, 2)
        args = table.put_item.call_args.kwargs
        self.assertEqual(args["Item"]["cost"], Decimal("3.25"))
        self.assertEqual(args["ExpressionAttributeValues"], {":v": 2})
        table.put_item.side_effect = ClientError({"Error": {"Code": "ConditionalCheckFailedException"}}, "PutItem")
        with self.assertRaises(Problem) as caught:
            store.save_itinerary("g", {"group_id": "g"}, 2)
        self.assertEqual(caught.exception.status, 409)
