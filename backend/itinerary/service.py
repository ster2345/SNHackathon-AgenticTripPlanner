"""Application service shared by Lambda and the local demo."""
from datetime import datetime, timezone
from .planner import Problem, fingerprint, generate, preferences, snapshot, text


class ItineraryService:
    def __init__(self, store, model, source="bedrock"):
        self.store, self.model, self.source = store, model, source

    def context(self, gid, uid):
        group, members = self.store.group(gid), self.store.members(gid)
        active = [m for m in members if m.get("status", "active") == "active"]
        if not any(m["user_id"] == uid for m in active):
            raise Problem("Active group membership is required.", 403)
        return group, active, self.store.users(active)

    def state(self, gid, uid):
        group, members, users = self.context(gid, uid)
        current = self.store.itinerary(gid)
        readiness_error, payload = None, None
        try:
            payload = snapshot(group, members, users)
        except Problem as exc:
            readiness_error = str(exc)
        return {"group": group, "members": [{"user_id": m["user_id"],
                "name": (users.get(m["user_id"]) or {}).get("name", m["user_id"]),
                "submitted": bool(m.get("preferences"))} for m in members],
                "preferences": next(m.get("preferences") for m in members if m["user_id"] == uid),
                "ready": payload is not None, "readiness_error": readiness_error,
                "itinerary": current, "stale": bool(current and (payload is None or current["input_hash"] != fingerprint(payload))),
                "source": self.source}

    def save_preferences(self, gid, uid, body):
        self.context(gid, uid)
        self.store.save_preferences(gid, uid, preferences(body))
        return self.state(gid, uid)

    def plan(self, gid, uid, recalculate=False, reason=""):
        group, members, users = self.context(gid, uid)
        payload = snapshot(group, members, users)
        previous = self.store.itinerary(gid)
        if recalculate and not previous:
            raise Problem("Generate an itinerary before recalculating.", 409)
        if previous and not recalculate:
            raise Problem("An itinerary already exists. Use Recalculate Itinerary.", 409)
        if reason:
            reason = text(reason, "Change reason", 1000)
        output = generate(payload, self.model, previous["itinerary"] if previous else None, reason)
        latest_group, latest_members, latest_users = self.context(gid, uid)
        if fingerprint(snapshot(latest_group, latest_members, latest_users)) != fingerprint(payload):
            raise Problem("Group inputs changed while generating. Please retry.", 409)
        version = previous["version"] if previous else 0
        record = {"schema_version": 1, "group_id": gid, "currency": group["currency"],
                  "version": version + 1, "source": self.source, "input_hash": fingerprint(payload),
                  "generated_at": datetime.now(timezone.utc).isoformat(), "itinerary": output}
        self.store.save_itinerary(gid, record, version)
        return record
