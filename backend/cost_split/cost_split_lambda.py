"""
Person C — Cost Split & Payment Tracking Lambda
-> to handle cost splitting and payment tracking for group activities. It provides endpoints for calculating cost splits, retrieving group payment ledgers, marking payments as paid, and drafting friendly reminder messages using Bedrock.
"""

import json
import boto3
import os

# ---------------------------------------------------------------
# 1. PURE LOGIC — no AWS dependency, test this in isolation
# ---------------------------------------------------------------

def calculate_split(total_cost, participant_ids, paid_by_user_id):
    """
    Split a single cost among participants, everyone owes the payer.

    total_cost: number
    participant_ids: list of user_ids who are splitting this cost
                      (include the payer in this list)
    paid_by_user_id: the user_id who fronted the money

    Returns a list of ledger entries:
      [{from_user_id, to_user_id, amount_owed, paid: False}, ...]
    Payer does not owe themselves, so they're excluded from the output.
    """
    if not participant_ids:
        return []

    share = round(total_cost / len(participant_ids), 2)

    return [
        {
            "from_user_id": uid,
            "to_user_id": paid_by_user_id,
            "amount_owed": share,
            "paid": False,
        }
        for uid in participant_ids
        if uid != paid_by_user_id
    ]


def aggregate_unpaid_totals(ledger_entries):
    """
    Given a flat list of ledger entries (like calculate_split produces,
    possibly across many activities), sum up how much each person
    still owes EACH OTHER person, only counting unpaid entries.

    Groups by (from_user_id, to_user_id) pair rather than just
    from_user_id, so if different people fronted different costs
    (not just one designated organizer), debts to different payers
    are tracked separately instead of blended into one number.

    Returns: { (from_user_id, to_user_id): total_unpaid_amount }
    e.g. {(1, 4): 32.0, (2, 4): 90.0, (1, 5): 10.0}
    means user 1 owes user 4 a total of $32, AND separately owes
    user 5 a total of $10.
    """
    totals = {}
    for entry in ledger_entries:
        if entry["paid"]:
            continue
        key = (entry["from_user_id"], entry["to_user_id"])
        totals[key] = round(totals.get(key, 0) + entry["amount_owed"], 2)
    return totals


# ---------------------------------------------------------------
# 2. AWS GLUE — DynamoDB read/write
# ---------------------------------------------------------------

PAYMENTS_TABLE = os.environ.get("PAYMENTS_TABLE", "Payments")

# NOTE: creating the boto3 client/resource is deferred into a function
# (rather than done immediately at import time) because boto3 errors out
# immediately if no AWS region/credentials are configured -- even if you
# never actually call a DynamoDB function. This lets you run this file
# locally (python person_c_cost_split_lambda.py) to test the pure math
# below without needing AWS set up at all.
_dynamodb = None

def _get_dynamodb():
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource("dynamodb")
    return _dynamodb


def save_ledger_entries(group_id, activity_ref, entries):
    table = _get_dynamodb().Table(PAYMENTS_TABLE)
    for entry in entries:
        table.put_item(
            Item={
                "group_id": str(group_id),
                # composite sort key so multiple entries per activity/user don't collide
                "entry_id": f"{activity_ref}#{entry['from_user_id']}#{entry['to_user_id']}",
                "activity_ref": activity_ref,
                "from_user_id": entry["from_user_id"],
                "to_user_id": entry["to_user_id"],
                "amount_owed": str(entry["amount_owed"]),  # Decimal-safe as string
                "paid": entry["paid"],
            }
        )


def get_group_ledger(group_id):
    table = _get_dynamodb().Table(PAYMENTS_TABLE)
    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key("group_id").eq(str(group_id))
    )
    return response.get("Items", [])


def mark_paid(group_id, entry_id, paid=True):
    table = _get_dynamodb().Table(PAYMENTS_TABLE)
    table.update_item(
        Key={"group_id": str(group_id), "entry_id": entry_id},
        UpdateExpression="SET paid = :p",
        ExpressionAttributeValues={":p": paid},
    )


# ---------------------------------------------------------------
# 3. OPTIONAL — Bedrock reminder message drafting
# ---------------------------------------------------------------

# Same lazy-loading approach as DynamoDB above -- avoids erroring at
# import time if AWS isn't configured yet.
_bedrock = None

def _get_bedrock():
    global _bedrock
    if _bedrock is None:
        _bedrock = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION", "us-east-1"))
    return _bedrock

# Check your Bedrock console for the exact model ID enabled in your account/region,
# this is the typical inference profile ID pattern for Claude on Bedrock:
CLAUDE_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-5-sonnet-20241022-v2:0")


def draft_reminder_message(user_name, amount_owed, trip_name, organizer_name):
    """
    Calls Claude via Bedrock to draft a friendly (not robotic) payment
    reminder. Returns plain text.
    """
    prompt = (
        f"Write a short, friendly group-chat style message reminding {user_name} "
        f"that they owe ${amount_owed} to {organizer_name} for the '{trip_name}' trip. "
        f"Keep it casual, one or two sentences, no corporate tone."
    )

    body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 150,
        "messages": [{"role": "user", "content": prompt}],
    }

    response = _get_bedrock().invoke_model(
        modelId=CLAUDE_MODEL_ID,
        body=json.dumps(body),
    )

    result = json.loads(response["body"].read())
    return result["content"][0]["text"]


# ---------------------------------------------------------------
# 4. LAMBDA HANDLER — routes API Gateway requests to the right function
# ---------------------------------------------------------------

def lambda_handler(event, context):
    """
    Expects API Gateway proxy integration. Route by event['path'] or
    event['resource'] depending on how you set up API Gateway.

    Example request bodies:

    POST /calculate-split
    { "group_id": 1, "activity_ref": "Dotonbori food walk",
      "total_cost": 60, "participant_ids": [1,2,3,4], "paid_by_user_id": 4 }

    GET /group/{group_id}/payments

    POST /group/{group_id}/mark-paid
    { "entry_id": "Dotonbori food walk#1#4" }

    POST /draft-reminder
    { "user_name": "Alex", "amount_owed": 32, "trip_name": "Osaka Weekend",
      "organizer_name": "Priya" }
    """
    try:
        route = event.get("resource", event.get("path", ""))
        body = json.loads(event.get("body") or "{}")

        if route == "/calculate-split":
            entries = calculate_split(
                body["total_cost"], body["participant_ids"], body["paid_by_user_id"]
            )
            save_ledger_entries(body["group_id"], body["activity_ref"], entries)
            return _response(200, {"entries": entries})

        elif route == "/group/{group_id}/payments":
            group_id = event["pathParameters"]["group_id"]
            ledger = get_group_ledger(group_id)
            totals = aggregate_unpaid_totals(
                [
                    {
                        "from_user_id": i["from_user_id"],
                        "to_user_id": i["to_user_id"],
                        "amount_owed": float(i["amount_owed"]),
                        "paid": i["paid"],
                    }
                    for i in ledger
                ]
            )
            # JSON object keys must be strings, so convert (from, to) tuples
            # into "from-to" style string keys before returning
            totals_json_safe = {f"{frm}-{to}": amt for (frm, to), amt in totals.items()}
            return _response(200, {"ledger": ledger, "unpaid_totals": totals_json_safe})

        elif route == "/group/{group_id}/mark-paid":
            group_id = event["pathParameters"]["group_id"]
            mark_paid(group_id, body["entry_id"], paid=True)
            return _response(200, {"status": "updated"})

        elif route == "/draft-reminder":
            message = draft_reminder_message(
                body["user_name"], body["amount_owed"], body["trip_name"], body["organizer_name"]
            )
            return _response(200, {"message": message})

        else:
            return _response(404, {"error": "Unknown route"})

    except Exception as e:
        return _response(500, {"error": str(e)})


def _response(status_code, body_dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body_dict),
    }


# ---------------------------------------------------------------
# 5. LOCAL TEST — run this file directly to sanity check the math
#    BEFORE touching AWS at all
# ---------------------------------------------------------------

if __name__ == "__main__":
    # Scenario A: single organizer (Priya, id 4) fronts everything --
    # mirrors the Osaka mock data
    entries_1 = calculate_split(60, [1, 2, 3, 4], paid_by_user_id=4)  # Dotonbori
    entries_2 = calculate_split(180, [2, 4], paid_by_user_id=4)       # Fine dining
    entries_3 = calculate_split(10, [1, 3], paid_by_user_id=4)        # Hiking

    all_entries = entries_1 + entries_2 + entries_3
    print("Scenario A (single organizer) ledger entries:", json.dumps(all_entries, indent=2))

    totals = aggregate_unpaid_totals(all_entries)
    print("Scenario A unpaid totals, keyed by (from, to):", totals)
    # Expect: {(1, 4): 20.0, (2, 4): 105.0, (3, 4): 20.0}

    print()

    # Scenario B: DIFFERENT people front different costs -- this is
    # the case the (from, to) pairing actually protects against.
    # User 1 (Alex) ends up owing two different people.
    entries_b1 = calculate_split(60, [1, 2, 3, 4], paid_by_user_id=4)   # Priya fronts group dinner
    entries_b2 = calculate_split(20, [1, 2], paid_by_user_id=2)         # Sam fronts a taxi, just for Alex + Sam

    all_entries_b = entries_b1 + entries_b2
    totals_b = aggregate_unpaid_totals(all_entries_b)
    print("Scenario B (multiple payers) unpaid totals, keyed by (from, to):", totals_b)
    # Expect Alex (user 1) to show up TWICE, owing two different people:
    # {(1, 4): 15.0, (2, 4): 15.0, (3, 4): 15.0, (1, 2): 10.0}
    # If we'd kept the old from-only grouping, Alex's two separate debts
    # ($15 to Priya, $10 to Sam) would have been wrongly merged into one
    # number, losing who he actually owes.
    print("Unpaid totals per user:", totals)
    # Expect: {1: 32.0, 2: 90.0, 3: 32.0} -- matches the mock spreadsheet