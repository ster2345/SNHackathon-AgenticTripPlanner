import copy
import json
import os
import unittest
from unittest.mock import Mock, patch

from backend.itinerary.demo import DemoStore, fixture_model
from backend.itinerary.itinerary_lambda import dispatch, lambda_handler
from backend.itinerary.planner import Problem, constraint_flags, generate, preferences, snapshot, validate_output
from backend.itinerary.service import ItineraryService


class PlannerTests(unittest.TestCase):
    def test_single_call_exposes_validation_failure_without_repair(self):
        model = Mock(return_value='{}')
        with patch.dict(os.environ, {'BEDROCK_SINGLE_CALL': '1'}):
            with self.assertRaises(Problem) as caught:
                generate(self.payload, model)
        model.assert_called_once()
        self.assertIn('days', str(caught.exception))
        self.assertIn('No automatic repair', str(caught.exception))

    def setUp(self):
        self.store = DemoStore()
        self.service = ItineraryService(self.store, fixture_model, "demo-fixture")
        self.payload = snapshot(self.store.group("osaka"), self.store.members("osaka"), self.store.users([]))

    def test_preferences_validation(self):
        valid = self.store.people[0]["preferences"]
        for changes in ({"budget_level": "cheap"}, {"must_do": []}, {"must_do": ["x"] * 4},
                        {"available_to": "2026-10-01"}, {"available_from": "20261016"}, {"must_do": [23]}):
            with self.subTest(changes=changes), self.assertRaises(Problem):
                preferences({**valid, **changes})
        self.assertEqual(preferences(valid), valid)

    def test_all_members_required(self):
        self.store.people[1].pop("preferences")
        self.assertFalse(self.service.state("osaka", "alex")["ready"])
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex")
        self.assertEqual(caught.exception.status, 409)

    def test_generation_over_budget_does_not_save(self):
        with patch('backend.itinerary.limits.time.monotonic', side_effect=[0, 0, 61]):
            with self.assertRaises(Problem) as caught:
                self.service.plan('osaka', 'alex')
        self.assertEqual(caught.exception.status, 504)
        self.assertIsNone(self.store.current)

    def test_inactive_member_does_not_block(self):
        self.store.people[1].pop("preferences")
        self.store.people[1]["status"] = "left"
        self.assertTrue(self.service.state("osaka", "alex")["ready"])

    def test_nonmember_cannot_read_or_save(self):
        for action in (lambda: self.service.state("osaka", "stranger"),
                       lambda: self.service.save_preferences("osaka", "stranger", self.store.people[0]["preferences"])):
            with self.assertRaises(Problem) as caught:
                action()
            self.assertEqual(caught.exception.status, 403)

    def test_conflicting_group_and_dates_flagged_without_relying_on_model(self):
        flags = constraint_flags(self.payload)
        self.assertTrue(any("Budgets differ" in f["issue"] for f in flags))
        self.payload["members"][0]["preferences"]["available_from"] = "2026-10-17"
        flags = constraint_flags(self.payload)
        self.assertIn(["alex"], [f["affected_members"] for f in flags])

    def test_prompt_contains_profiles_and_prior_itinerary_on_dropout(self):
        first = self.service.plan("osaka", "alex")
        self.store.people[1]["status"] = "left"
        model = Mock(side_effect=fixture_model)
        self.service.model = model
        self.assertTrue(self.service.state("osaka", "alex")["stale"])
        second = self.service.plan("osaka", "alex", True, "Sam left")
        system, message = model.call_args.args
        request = json.loads(message)
        self.assertEqual(request["previous_itinerary"], first["itinerary"])
        self.assertEqual(request["change_reason"], "Sam left")
        self.assertNotIn("sam", [m["user_id"] for m in request["group_input"]["members"]])
        self.assertIn("Vegetarian", request["group_input"]["members"][0]["dietary_needs"])
        self.assertIn("preserve unaffected", system)
        self.assertEqual(second["version"], 2)
        self.assertEqual(first["itinerary"]["days"][0]["activities"][0]["activity_id"],
                         second["itinerary"]["days"][0]["activities"][0]["activity_id"])
        self.assertFalse(self.service.state("osaka", "alex")["stale"])

    def test_preference_edit_makes_saved_plan_stale(self):
        self.service.plan("osaka", "alex")
        self.service.save_preferences("osaka", "alex", {**self.store.people[0]["preferences"], "must_do": ["Museums"]})
        self.assertTrue(self.service.state("osaka", "alex")["stale"])

    def test_recalculation_sends_updated_must_dos_with_previous_draft(self):
        first = self.service.plan("osaka", "alex")
        self.service.save_preferences("osaka", "alex", {
            **self.store.people[0]["preferences"], "must_do": ["Museums"]})
        model = Mock(side_effect=fixture_model)
        self.service.model = model
        self.service.plan("osaka", "alex", True)
        request = json.loads(model.call_args.args[1])
        alex = next(m for m in request["group_input"]["members"] if m["user_id"] == "alex")
        self.assertEqual(alex["preferences"]["must_do"], ["Museums"])
        self.assertEqual(request["previous_itinerary"], first["itinerary"])

    def test_invalid_json_is_not_saved(self):
        self.service.model = lambda *_: "```json\n{}\n```"
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex")
        self.assertEqual(caught.exception.status, 502)
        self.assertIsNone(self.store.current)

    def test_markdown_fenced_json_is_accepted_without_retry(self):
        def fenced(system, message):
            return "```json\n" + fixture_model(system, message) + "\n```"
        self.service.model = Mock(side_effect=fenced)
        result = self.service.plan("osaka", "alex")
        self.assertEqual(len(result["itinerary"]["days"]), 3)
        self.assertEqual(self.service.model.call_count, 1)

    def test_malformed_response_is_regenerated_once(self):
        calls = []
        def retry(system, message):
            calls.append(message)
            if len(calls) == 1:
                return 'Here is your itinerary: {"days":'
            # A real model receives the repair instructions; the fixture accepts JSON only.
            return fixture_model(system, calls[0])
        self.service.model = retry
        self.assertEqual(self.service.plan("osaka", "alex")["version"], 1)
        self.assertEqual(len(calls), 2)
        self.assertIn("no trailing commas", calls[1])

    def test_bad_responses_are_bounded_and_preserve_saved_draft(self):
        original = self.service.plan("osaka", "alex")
        self.service.model = Mock(return_value='{"days":')
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex", True)
        self.assertEqual(self.service.model.call_count, 2)
        self.assertIn("one automatic retry", str(caught.exception))
        self.assertEqual(self.store.current, original)

    def test_model_access_error_is_not_retried(self):
        self.service.model = Mock(side_effect=Problem("Access denied", 503))
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex")
        self.assertEqual(caught.exception.status, 503)
        self.assertEqual(self.service.model.call_count, 1)

    def test_output_rejects_missing_dates_unknown_members_duplicate_ids_bad_costs(self):
        original = generate(self.payload, fixture_model)
        mutations = [lambda v: v["days"].pop(),
                     lambda v: v["days"][0]["activities"][0].update(participant_ids=["departed"]),
                     lambda v: v["days"][0]["activities"][0].update(estimated_cost_per_person=-1),
                     lambda v: v["days"][0]["activities"][0].update(estimated_cost_per_person=float("nan")),
                     lambda v: v["days"][0]["activities"][0].update(time="25:00"),
                     lambda v: v["days"][1]["activities"][0].update(activity_id="day1-morning"),
                     lambda v: v.update(flags=[{"issue": "Unknown", "affected_members": ["ghost"]}])]
        for mutate in mutations:
            value = copy.deepcopy(original)
            mutate(value)
            with self.assertRaises(Problem):
                validate_output(value, self.payload)

    def test_changed_inputs_during_generation_do_not_overwrite(self):
        def changed(system, message):
            self.store.people[0]["preferences"]["budget_level"] = "$$"
            return fixture_model(system, message)
        self.service.model = changed
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex")
        self.assertEqual(caught.exception.status, 409)
        self.assertIsNone(self.store.current)

    def test_simultaneous_generation_does_not_overwrite(self):
        def competing(system, message):
            self.store.current = {"version": 1}
            return fixture_model(system, message)
        self.service.model = competing
        with self.assertRaises(Problem) as caught:
            self.service.plan("osaka", "alex")
        self.assertEqual(caught.exception.status, 409)
        self.assertEqual(self.store.current, {"version": 1})

    def test_recalculation_requires_previous_draft(self):
        with self.assertRaises(Problem):
            self.service.plan("osaka", "alex", True)

    def test_api_routes_and_methods(self):
        result = dispatch(self.service, "POST", "/groups/osaka/itinerary", "alex", {})
        self.assertEqual(result["version"], 1)
        with self.assertRaises(Problem) as caught:
            dispatch(self.service, "DELETE", "/groups/osaka/preferences", "alex", {})
        self.assertEqual(caught.exception.status, 405)

    def test_lambda_requires_authorizer(self):
        self.assertEqual(lambda_handler({"httpMethod": "GET", "path": "/groups/osaka/itinerary"}, None)["statusCode"], 401)

    def test_lambda_uses_authenticated_identity_and_handles_bad_json(self):
        event = {"httpMethod": "GET", "path": "/groups/osaka/itinerary", "requestContext": {"authorizer": {"claims": {"sub": "alex"}}}}
        with patch("backend.itinerary.itinerary_lambda.DynamoStore", return_value=self.store):
            self.assertEqual(lambda_handler(event, None)["statusCode"], 200)
            self.assertEqual(lambda_handler({**event, "body": "{"}, None)["statusCode"], 400)
            self.assertEqual(lambda_handler({**event, "body": "[]"}, None)["statusCode"], 400)


if __name__ == "__main__":
    unittest.main()
