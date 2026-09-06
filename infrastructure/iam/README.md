# Person B AWS permissions and personal-account testing

The team policy selects `anthropic.claude-3-5-sonnet-20241022-v2:0` (Claude 3.5
Sonnet v2). `.env.example` now selects the same model, and explicitly names the
`Users`, `Groups`, `GroupMembers`, `Itinerary`, and `Payments` tables.
The policy is a permission document, not an automatically applied configuration.
Changing this file does not attach permissions in AWS or enable model access.

The model ID being consistent does not prove availability: the team's older Sonnet
model must still be available to your account in the chosen region. The current
configuration uses a direct model ID, not a global/APAC profile. If AWS requires a
profile or reports the model unavailable/retired, the team must select a supported
model/profile and update the policy and configuration together. Do not silently
switch back to the personal Haiku model or add `bedrock:*` permissions.

## Personal SSO account

Personal-account testing is supported. The local profile name is an arbitrary label
for your AWS CLI login, such as `personal`. It is not your name, password, access key,
or Bedrock model ID. Being logged into the AWS website does not configure CLI SSO.

```powershell
aws configure list-profiles
# If you use IAM Identity Center and have its start URL and SSO region:
aws configure sso --profile personal
aws sso login --profile personal
$env:AWS_PROFILE = "personal"
aws sts get-caller-identity
```

Use your own Identity Center start URL and region from the AWS access portal.
If you only have an ordinary AWS console account and no access portal, do not
invent SSO values; identify the actual login method before configuring this.
No personal AWS profile or role has been selected or modified by this code change.

If you normally sign in with email/password to the AWS console, that is not evidence
of an SSO setup. In your own PowerShell terminal, `aws sts get-caller-identity` checks
whether that terminal already has an AWS identity. The agent's terminal may not share
its environment variables. A missing-credentials error means local AWS authentication
still needs setup. Do not create root-user access keys. You can inspect IAM roles and
attach the reviewed policy through the console using an authorized administrator,
once the intended account and target role have been identified.

## Concrete permissions to attach

`Shared_IAM_policy.json` is the team's broad cross-account example. For personal
testing, render the narrower Person B policy for **your confirmed account**:

```powershell
python infrastructure/iam/render_person_b_policy.py --account-id YOUR_12_DIGIT_ACCOUNT_ID --region ap-southeast-1
```

It grants reads of planner input tables, updates to GroupMembers, writes to
Itinerary, DescribeTable for schema checks, and invocation/metadata access for
the exact team model. It excludes account creation, Cognito administration,
payments writes, table creation, and unrelated model access.

For an **SSO login**, an administrator adds this policy to the selected **IAM
Identity Center permission set** and provisions it to the personal account.
Preserve existing permissions; don't overwrite an existing inline policy blindly.
Do not directly edit the generated `AWSReservedSSO_...` role.
[AWS permission set guidance](https://docs.aws.amazon.com/singlesignon/latest/userguide/permissionsetsconcept.html)

For a **Lambda execution role**, attach an account-scoped version of these app
permissions to that named role, alongside its existing logging policy. Lambda
uses its execution role, not your local SSO session. Person A configures the
Cognito/API Gateway authorizer. No AWS permission changes happen automatically.

## Read-only checks, then a live call

```powershell
.\.venv\bin\python.exe -m backend.itinerary.aws_check --profile personal
.\.venv\bin\python.exe -m backend.itinerary.smoke_test
```

Use `.venv\Scripts\python.exe` instead for a standard Windows venv. The first
command prints the account/identity, checks model metadata, and validates the
four Person B DynamoDB table schemas. Required primary keys are strings:

| Table | Partition key | Sort key |
| --- | --- | --- |
| Users | user_id | none |
| Groups | group_id | none |
| GroupMembers | group_id | user_id |
| Itinerary | group_id | none |

The check creates no resources and writes no records. DescribeTable success does
not prove GetItem/Query/PutItem/UpdateItem access; the real API flow must still be
tested against agreed test records. The smoke test is a billed Claude invocation.
Local `--live` mode calls Claude but still does not exercise DynamoDB permissions.
