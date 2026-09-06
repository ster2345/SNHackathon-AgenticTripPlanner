"""Local-only in-memory fixture. Never used by the production Lambda."""
import copy
import json
from datetime import timedelta
from .planner import Problem, iso_date

GROUP = {"group_id": "osaka", "name": "Osaka with friends", "destination": "Osaka, Japan",
         "start_date": "2026-10-16", "end_date": "2026-10-18", "currency": "SGD"}
USERS = {
    "alex": {"name": "Alex", "dietary_needs": ["Vegetarian"], "blacklist": ["Meat tasting"]},
    "sam": {"name": "Sam", "dietary_needs": [], "blacklist": []},
    "priya": {"name": "Priya", "dietary_needs": [], "blacklist": ["Strenuous hiking"]},
}


class DemoStore:
    def __init__(self):
        self.people = [{"group_id": "osaka", "user_id": uid, "status": "active", "preferences": {
            "budget_level": budget, "must_do": activities, "available_from": "2026-10-16", "available_to": "2026-10-18"}}
            for uid, budget, activities in [("alex", "$", ["Parks", "Vegetarian food"]),
                                            ("sam", "$$$", ["Fine dining", "Shopping"]),
                                            ("priya", "$$", ["Museums", "Food"])] ]
        self.current = None

    def group(self, gid):
        if gid != "osaka":
            raise Problem("Demo group not found.", 404)
        return copy.deepcopy(GROUP)

    def members(self, gid):
        self.group(gid)
        return copy.deepcopy(self.people)

    def users(self, members):
        return copy.deepcopy(USERS)

    def save_preferences(self, gid, uid, prefs):
        self.group(gid)
        for person in self.people:
            if person["user_id"] == uid and person["status"] == "active":
                person["preferences"] = copy.deepcopy(prefs)
                return
        raise Problem("Active member not found.", 403)

    def itinerary(self, gid):
        self.group(gid)
        return copy.deepcopy(self.current)

    def save_itinerary(self, gid, record, expected_version):
        self.group(gid)
        if (self.current or {}).get("version", 0) != expected_version:
            raise Problem("Itinerary version changed. Refresh and retry.", 409)
        self.current = copy.deepcopy(record)


def fixture_model(system, message):
    """Fixed examples exercise rendering and integration; this is explicitly NOT an AI planner."""
    request = json.loads(message)
    payload = request["group_input"]
    ids = [m["user_id"] for m in payload["members"]]
    previous = request["previous_itinerary"]
    if previous:
        output = copy.deepcopy(previous)
        for day in output["days"]:
            for activity in day["activities"]:
                activity["participant_ids"] = ids
        output["changes"] = ["Demo fixture refreshed participant lists. Live Claude is required to adapt activities to changed preferences."]
    else:
        start, end = iso_date(payload["group"]["start_date"]), iso_date(payload["group"]["end_date"])
        output = {"days": [], "flags": [], "changes": []}
        for n in range((end-start).days + 1):
            output["days"].append({"date": (start + timedelta(days=n)).isoformat(), "activities": [{
                "activity_id": f"day{n+1}-morning", "time": "10:00", "title": ["Osaka Castle park walk", "Museum and neighbourhood walk", "Market browsing"][n % 3],
                "description": "Illustrative demo activity; verify availability before making plans.",
                "reason": "An affordable shared outing; this fixture does not evaluate the entered preferences.",
                "participant_ids": ids, "estimated_cost_per_person": 0,
                "dietary_notes": "Choose a suitable vegetarian lunch separately; confirm ingredients with the venue."}]})
    output["flags"] = [{"issue": "Demo fixture only: a premium dining request may conflict with a low budget and vegetarian needs. Claude must assess the actual group inputs.", "affected_members": ids}]
    return json.dumps(output)
