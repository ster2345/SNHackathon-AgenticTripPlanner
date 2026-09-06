# Person B: preferences and itinerary agent

This module implements preference intake, Claude itinerary generation, conflict flags,
and manual recalculation. The confirmed stack is React, Python, AWS Lambda, API Gateway,
DynamoDB, Cognito, Bedrock, and IAM, with Amplify or S3/CloudFront for frontend hosting.
The exact table fields below are **proposed, not confirmed with Person A**.
No accounts, group creation, actual bookings, or payment processing are added here.

## Run locally

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
npm.cmd --prefix frontend/itinerary install
npm.cmd --prefix frontend/itinerary run build
.\.venv\Scripts\python.exe -m backend.itinerary.local_server
```

For MSYS Python, the interpreter may be `.venv\bin\python.exe` instead.
Once React has been built, the fixture backend needs no Python dependencies:
`python -m backend.itinerary.local_server`.
Open <http://127.0.0.1:8765>. The demo uses three sample members with deliberately
conflicting budgets, vegetarian needs, and must-dos. Its state is in memory and resets
on restart. Fixture output is explicitly labelled and does **not** perform AI optimization.

1. Switch between members and save their preferences.
2. Generate the itinerary; inspect the Heads up flags and day cards.
3. Change a preference or use the local-only member departure controls.
4. Click Recalculate Itinerary and inspect the changes list.

## First real Claude call (separate from the app)

Copy `.env.example` to `.env` if you do not already have one. Set `AWS_REGION` and
`BEDROCK_MODEL_ID` to a Claude model or inference profile enabled in the team's account.
Use your team's AWS credential setup (for example AWS SSO and `AWS_PROFILE`); never put
credentials in the frontend. No Anthropic API key is needed for the Bedrock route.

```powershell
.\.venv\Scripts\python.exe -m backend.itinerary.smoke_test
```

Success prints `BEDROCK_OK: Claude access works.` This only invokes Claude; it does not
read or write application tables. Missing configuration, credentials, permissions, or
model access produces an explicit setup failure, not a fake success.

After the smoke test passes, test **real generation with the conflicting sample group**:

```powershell
.\.venv\Scripts\python.exe -m backend.itinerary.local_server --live
```

`--live` calls Claude but still uses memory-only sample data, not DynamoDB. Inspect whether
vegetarian needs and blacklists are respected, premium dining is optional, and reasons
refer to the actual members. Then remove Sam and recalculate; compare unchanged activity
IDs and the changes list. Automated fixture tests cannot establish model quality.

The adapter uses AWS's [Converse API](https://docs.aws.amazon.com/boto3/latest/reference/services/bedrock-runtime/client/converse.html).
It sends profile text as untrusted input, validates returned JSON, rejects incomplete
responses, and saves only validated output. A single Markdown JSON fence is accepted.
Malformed JSON or invalid itinerary fields trigger at most one fresh generation attempt
(one additional billed model call); a second failure preserves the existing draft and
shows an error. Model-access and transport errors are not retried by this output-repair loop.
Allow for two inference calls when setting request timeouts. Budget and date conflicts are also detected
in Python. Semantic suitability and minimal disruption are prompt requirements, not
formally guaranteed; review suggestions before booking.

## Contract for Person A

All IDs are strings. The AWS implementation expects these DynamoDB keys and attributes:

| Table / environment variable | Primary key | Attributes consumed by Person B |
| --- | --- | --- |
| `Users` / `USERS_TABLE` | partition `user_id` | `name`, `dietary_needs: string[]`, `blacklist: string[]` |
| `Groups` / `GROUPS_TABLE` | partition `group_id` | `name`, `destination`, `start_date`, `end_date`, `currency` (e.g. SGD) |
| `GroupMembers` / `GROUP_MEMBERS_TABLE` | partition `group_id`, sort `user_id` | `status` (`active` or `left`; absent means active), `preferences` map |
| `Itinerary` / `ITINERARY_TABLE` | partition `group_id` | The versioned record below; latest draft only |

Only the `preferences` attribute is updated on an existing active membership. Person A
owns profile and membership writes. Birthday/age and login details are not sent to Claude.
Normalize dietary dropdown/free-text values to arrays before storing. Trips must span
one to five days, have one destination, and include a currency. All active members must
have valid preferences and profiles before generation. Readiness is checked on the server.

```json
{
  "budget_level": "$",
  "must_do": ["Parks", "Vegetarian food"],
  "available_from": "2026-10-16",
  "available_to": "2026-10-18"
}
```

Budgets are relative levels, not numeric caps. Availability is an inclusive date range;
the group trip dates stay fixed and conflicts are flagged. Profile edits, preferences,
departures, and trip date edits make the previous draft stale on the next fetch.
Recalculation is manual and includes the prior itinerary, active profiles/preferences,
and optional change reason. Concurrent itinerary saves use a conditional version check;
inputs are re-read before saving. An edit immediately after that check can still make
the resulting draft stale; the next GET detects it. Coordinate a stronger transaction
contract if the team later needs production-level cross-table concurrency guarantees.

## API and frontend handoff

Lambda handler: `backend.itinerary.itinerary_lambda.lambda_handler`. Package the
repository's `backend` directory and installed dependencies at the Lambda zip root.
Configure an API Gateway Cognito/JWT authorizer on all non-OPTIONS routes. The trusted
authorizer claim `sub` must equal `Users.user_id`; IDs supplied by the browser are not
used for identity. The handler accepts REST API and HTTP API proxy events.

| Method | Route | Body / result |
| --- | --- | --- |
| GET | `/groups/{group_id}/preferences` | State, current user's preferences, member submission status, readiness and saved draft |
| PUT | `/groups/{group_id}/preferences` | Preferences object above; returns updated state |
| GET | `/groups/{group_id}/itinerary` | Same state; includes `stale` |
| POST | `/groups/{group_id}/itinerary` | `{}`; generates the first draft |
| POST | `/groups/{group_id}/itinerary/recalculate` | `{"reason":"Sam left"}`; adjusts an existing draft |

Any active group member may generate/recalculate. A failed request returns
`{"error":"..."}` with 400/401/403/404/409/502/503 as appropriate; unexpected storage errors
return 500 and are logged. PUT cannot create a membership. Departed members cannot read
group data through these routes. The demo's identity switch and `/demo/membership` route
exist only in the loopback server, never in Lambda.

The React component is `frontend/itinerary/src/TripPlanner.jsx`. Person A can import it
into the group page (and import `frontend/itinerary/style.css`, or merge those styles).
Mount with `key={currentGroupId}` so switching trips resets in-flight local state.
Keep `getToken` stable with React `useCallback`; retrieve a fresh Cognito JWT from the
existing session SDK on each call. Person A owns signup/login.

```javascript
<TripPlanner
  key={currentGroupId}
  apiBase="https://YOUR_API_GATEWAY_HOST"
  groupId={currentGroupId}
  getToken={getCognitoToken}
  onItinerarySaved={refreshCostDashboard}
/>
```

The optional `onItinerarySaved(record)` callback tells Person C to refresh estimates;
it does not change actual expenses or payments. `demo` defaults to false. The standalone
entry automatically enables the fixture only on loopback hostnames. It can also accept
`window.TRIP_PLANNER_CONFIG` (the same component props) set before the entry script.
Never include AWS credentials or a Bedrock key in frontend configuration. Set
`FRONTEND_ORIGIN` to the exact frontend origin and allow unauthenticated CORS preflight.
The Cognito JWT must be verified by API Gateway; the Lambda trusts only its authorizer claims.

For React development, run `npm.cmd --prefix frontend/itinerary run dev` while the Python
server is on port 8765, then open http://127.0.0.1:5173. Vite proxies only the local API
routes. To use Claude, start the Python server with `--live` on the same port.
For the single-port demo, rebuild React after frontend edits and use port 8765.

## AWS frontend hosting

`npm.cmd --prefix frontend/itinerary run build` produces static files under
`frontend/itinerary/dist`. The build uses [Vite](https://vite.dev/guide/static-deploy).
For Amplify Hosting, set the app root to `frontend/itinerary`, install with `npm ci`,
build with `npm run build`, and publish `dist`. For S3/CloudFront, publish the contents
of `dist` with `index.html` as the entry page. First integrate Person A's authenticated
group page; the standalone hosted entry intentionally does not expose demo identities.
Set `FRONTEND_ORIGIN` on Lambda to the final HTTPS frontend origin. Hosting is not
deployed by this change; the team still needs to choose Amplify or S3/CloudFront.

Allow sufficient Lambda runtime for inference (e.g. 150 seconds) and check the actual API
Gateway integration timeout before deployment. This MVP uses a synchronous request; if
inference exceeds the gateway's available timeout, use a queued job/polling API before
hosting. No AWS infrastructure is provisioned or deployed by this change.

## Itinerary JSON for Person C

Both POST routes return this record; GET exposes it under `itinerary` (or `null`):

```json
{
  "schema_version": 1,
  "group_id": "osaka",
  "currency": "SGD",
  "version": 1,
  "source": "bedrock",
  "input_hash": "sha256-of-group-inputs",
  "generated_at": "2026-09-05T12:00:00+00:00",
  "itinerary": {
    "days": [{
      "date": "2026-10-16",
      "activities": [{
        "activity_id": "day1-morning",
        "time": "09:00",
        "title": "Park walk",
        "description": "An easy morning walk",
        "reason": "A low-cost outdoors option for Alex",
        "participant_ids": ["alex", "priya"],
        "estimated_cost_per_person": 0,
        "dietary_notes": "No food included; confirm lunch options separately."
      }]
    }],
    "flags": [{"issue": "Budgets differ", "affected_members": ["alex", "sam", "priya"]}],
    "changes": []
  }
}
```

The snippet shows one day; a generated itinerary includes every trip date. Activity IDs
are unique within a draft and Claude is asked to retain them for unchanged activities.
Costs are finite, nonnegative numbers with at most two decimal places, per participant,
in the record's currency. They are **estimates**, not actual expenses or payment requests.
Person C can map `activity_id` to their `activity_ref` and use `participant_ids` to suggest
a split, but should use an explicitly entered actual cost and payer to create ledger
entries. Recalculation never rewrites paid balances or invokes Person C's Lambda.
Refresh Person C's dashboard after the plan POST completes if it displays estimates.

## Verification

Every new activity has application-assigned `verification_status: "unverified"`, and
the UI labels every suggestion as unverified. No venue or route data source is connected;
model prose is not evidence of certification, accessibility, or dietary suitability.
On recalculation, Python restores prior activity IDs for unique matches on date, time,
title (case-insensitive), and remaining participants, unless reassignment collides.
Ambiguous or renamed activities rely on the prompt's identity-preservation instructions;
the application does not guess identities from similar wording.

Saved itineraries now also contain `estimated_totals: {by_member: {user_id: amount},
group_total: amount}` inside the inner `itinerary` object. Python computes these using
decimal arithmetic and actual participant assignments. Totals include only listed
activity estimates, not omitted travel expenses or ledger debts. Old drafts gain this
field on their next recalculation. The React screen displays the computed totals.

On recalculation, Python replaces the model's `changes` with a comparison of activity
IDs, participants, dates, times, titles, costs, text, and flags. Removing a participant
is distinguished from removing an activity; continuing members' estimate changes are
calculated rather than invented by the model. An unchanged plan reports no changes.
The prompt prioritizes economical shared activities and separate premium options,
but budget levels remain qualitative, so numeric budget compliance is not enforced.
Model-written flags may still contain inaccurate claims; the computed totals are the
authoritative sums of the activity estimates.

```powershell
python -m unittest discover -s tests -v
```

Tests cover invalid preferences, readiness, membership authorization, conflicting budgets
and dates, unsafe output shapes, stale drafts, dropout payloads, and concurrent changes.
The fixture is intentionally distinct from real model evidence. Run the smoke test and
the `--live` scenario with the team's credentials to verify Bedrock and model behavior.
Production DynamoDB integration requires the agreed tables, keys, and IAM permissions.
The existing IAM sample permits a specific older model; reconcile it with the exact
`BEDROCK_MODEL_ID` you choose. Inference profiles may require additional profile and
destination model resources in IAM; do not broaden permissions to arbitrary services.
