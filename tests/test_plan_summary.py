import copy
import unittest
from backend.itinerary.demo import DemoStore, fixture_model
from backend.itinerary.planner import estimated_totals, summarize_changes, preserve_activity_ids
from backend.itinerary.service import ItineraryService


class SummaryTests(unittest.TestCase):
    def setUp(self):
        self.service = ItineraryService(DemoStore(), fixture_model, "demo-fixture")
        self.plan = self.service.plan("osaka", "alex")["itinerary"]

    def test_totals_use_exact_decimals_and_selected_participants(self):
        self.plan["days"][0]["activities"][0].update(estimated_cost_per_person=0.1, participant_ids=["alex"])
        self.plan["days"][1]["activities"][0].update(estimated_cost_per_person=0.2, participant_ids=["alex", "priya"])
        self.assertEqual(estimated_totals(self.plan), {"by_member": {"alex": 0.3, "priya": 0.2, "sam": 0.0}, "group_total": 0.5})

    def test_removed_participant_is_not_reported_as_removed_activity(self):
        revised = copy.deepcopy(self.plan)
        revised["days"][0]["activities"][0]["participant_ids"].remove("sam")
        changes = summarize_changes(self.plan, revised, "SGD")
        self.assertEqual(changes, ["day1-morning: removed participants sam."])

    def test_add_remove_reschedule_and_cost_changes(self):
        revised = copy.deepcopy(self.plan)
        revised["days"][0]["activities"][0].update(time="11:00", estimated_cost_per_person=12)
        revised["days"][1]["activities"][0]["activity_id"] = "replacement"
        changes = summarize_changes(self.plan, revised, "SGD")
        self.assertTrue(any("Removed activity" in c for c in changes))
        self.assertTrue(any("Added activity" in c for c in changes))
        self.assertTrue(any("time changed" in c for c in changes))
        self.assertTrue(any("SGD 0.00 to SGD 12.00" in c for c in changes))

    def test_no_change_and_initial_draft(self):
        self.assertEqual(self.plan["changes"], [])
        self.assertEqual(summarize_changes(self.plan, self.plan, "SGD"), ["No activity or flag changes in this recalculation."])

    def test_dropout_summary_is_computed_not_model_authored(self):
        self.service.store.people[1]["status"] = "left"
        plan = self.service.plan("osaka", "alex", True)["itinerary"]
        self.assertTrue(any("removed participants sam" in c for c in plan["changes"]))
        self.assertNotIn("sam", plan["estimated_totals"]["by_member"])

    def test_surviving_alternative_keeps_its_id(self):
        before = copy.deepcopy(self.plan)
        dinner = before["days"][0]["activities"][0]
        dinner.update(activity_id="dinner-alt", title="Vegetarian dinner", participant_ids=["alex", "priya"])
        premium = {**dinner, "activity_id": "premium", "title": "Fine dining", "participant_ids": ["sam"]}
        before["days"][0]["activities"].append(premium)
        after = copy.deepcopy(before)
        after["days"][0]["activities"] = [{**dinner, "activity_id": "premium"}]
        preserve_activity_ids(before, after, ["alex", "priya"])
        self.assertEqual(after["days"][0]["activities"][0]["activity_id"], "dinner-alt")

    def test_different_activity_is_not_matched_by_time_alone(self):
        after = copy.deepcopy(self.plan)
        after["days"][0]["activities"][0].update(activity_id="new", title="Different destination")
        preserve_activity_ids(self.plan, after, ["alex", "priya", "sam"])
        self.assertEqual(after["days"][0]["activities"][0]["activity_id"], "new")

    def test_verification_status_is_application_owned(self):
        self.assertTrue(all(a["verification_status"] == "unverified" for d in self.plan["days"] for a in d["activities"]))
