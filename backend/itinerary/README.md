# Person B: Trip Preferences & Itinerary Agent

## Progress and next steps

- **Done:** the trip planner is connected to the team's dashboard. Members can
  enter preferences, generate a plan, and recalculate it when plans change.
- **Tested:** the local demo works, 40 backend tests pass, and a small test call
  to Claude succeeded.
- **Current issue:** AWS sometimes limits our AI requests (throttling). Request
  limits and timeouts have been added, but full AI generation needs another test.
- **Still needed:** connect and test the real database and user login with Person A,
  then deploy the app to AWS.

To try it, use the commands below. The normal demo uses sample output and needs
no AWS login. Add `--live` to use real Claude after setting up your AWS access.
Demo data resets when the Python server restarts, even in live mode.

The integrated dashboard now saves profiles, memberships, and displayed itinerary
rows in browser storage. Planner preferences and the full draft still live in the
Python server's memory; restarting that server resets them.

The merged Person A flow currently works locally. Its AWS handlers still need
database helpers in `backend/shared/db.py`, corrected create/get profile handlers,
and a shared profile/group schema with the planner (dietary/blacklist arrays and
group currency). Do not treat the local dashboard as proof of AWS integration.

Teammates should use their own AWS login. Keep credentials private and do not
commit `.env`. See the [setup guide](../../docs/person-b.md) when ready to connect AWS.

## Run the integrated dashboard

Run these commands from the project root (`SNHackathon-AgenticTripPlanner`), not this folder.

The latest team dashboard is integrated with Person B's planner. Build and run it:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
python -m backend.itinerary.local_server --dashboard --port 8768
```

Open http://127.0.0.1:8768, then Itineraries → Osaka → Open planner.
This is a local fixture flow; add `--live` with the configured Python environment
to call Bedrock. [AWS/SSO setup and permission checks](../../infrastructure/iam/README.md)
explain how to test the team's model and DynamoDB schemas in a personal account.

The Person B module includes a React preference form, Claude/Bedrock planning, conflict flags,
and manual recalculation using the previous itinerary. Run the local fixture demo:

```bash
npm.cmd --prefix frontend/itinerary install
npm.cmd --prefix frontend/itinerary run build
python -m backend.itinerary.local_server
```

Open http://127.0.0.1:8765. This demo uses sample members and fixed, labelled output;
use `--live` after configuring Bedrock to test real Claude generation.

See [Person B setup and team handoff](../../docs/person-b.md) for the standalone Claude
smoke test, proposed database fields, API routes, frontend integration, and itinerary
JSON contract for Persons A and C. DynamoDB and Cognito are the agreed services;
the exact shared table fields still need to be confirmed with Person A.

Run backend tests with `python -m unittest discover -s tests -v`.

