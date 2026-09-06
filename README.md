# SNHackathon-AgenticTripPlanner

A group trip planning application that helps groups coordinate itineraries, preferences, and shared costs.

## Person B: Trip Preferences & Itinerary Agent

The latest team dashboard is integrated with Person B's planner. Build and run it:

```powershell
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run build
python -m backend.itinerary.local_server --dashboard --port 8768
```

Open http://127.0.0.1:8768, then Itineraries → Osaka → Open planner.
This is a local fixture flow; add `--live` with the configured Python environment
to call Bedrock. [AWS/SSO setup and permission checks](infrastructure/iam/README.md)
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

See [Person B setup and team handoff](docs/person-b.md) for the standalone Claude
smoke test, proposed database fields, API routes, frontend integration, and itinerary
JSON contract for Persons A and C. DynamoDB and Cognito are the agreed services;
the exact shared table fields still need to be confirmed with Person A.

Run backend tests with `python -m unittest discover -s tests -v`.

The project aims to:
- Collect user profiles and trip preferences
- Generate itineraries based on group constraints
- Flag conflicts between members' preferences
- Re-optimise itineraries when plans change
- Calculate and track shared trip expenses

---

## Current Tech Stack

- **Python** — backend logic
- **AWS Lambda** — serverless backend functions
- **AWS IAM** — AWS permissions and access management

The agreed application stack also uses **React**, **AWS API Gateway**, **DynamoDB**,
**Amazon Cognito**, and **Amazon Bedrock**. Frontend hosting will use **AWS Amplify**
or **S3/CloudFront** (choice pending).

---

## Project Structure

```text
SNHackathon-AgenticTripPlanner/
│
├── backend/
│   ├── itinerary/
│   └── cost_split/
│   
├── frontend/
│
├── infrastructure/
│   └── iam/
│
├── data/
├── docs/
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

# Setup

## 1. Clone the repository

```bash
git clone <REPOSITORY_URL>
cd SNHackathon-AgenticTripPlanner
```

Replace `<REPOSITORY_URL>` with the GitHub repository URL.

---

## 2. Create a Python virtual environment

### Windows

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

### macOS / Linux

```bash
python3 -m venv .venv
source .venv/bin/activate
```

When the virtual environment is activated, `(.venv)` should appear in the terminal.

---

## 3. Install dependencies

```bash
pip install -r requirements.txt
```

Current Python dependencies:

- `boto3`
- `python-dotenv`

If additional packages are required, add them to `requirements.txt`.

---

## 4. Set up environment variables

Create a local `.env` file using `.env.example` as a template.

### Windows

```powershell
Copy-Item .env.example .env
```

### macOS / Linux

```bash
cp .env.example .env
```

Current `.env.example`:

```env
AWS_REGION=ap-southeast-1
```

More environment variables will be added as additional AWS services are configured.

> Do not commit `.env`, AWS credentials, API keys, or other secrets.

---

## 5. AWS setup

Some backend functionality uses AWS services.

Ensure you have access to the AWS environment being used by the team.

If using the AWS CLI, check that it is installed:

```bash
aws --version
```

AWS authentication should follow the method agreed on by the team.

Do not hardcode AWS access keys or secret keys in the repository.

---

# Development Workflow

Before starting work:

```bash
git pull
```

Create a feature branch:

```bash
git checkout -b feature/<feature-name>
```

Example:

```bash
git checkout -b feature/group-management
```

After making changes:

```bash
git add .
git commit -m "Describe changes here"
git push -u origin feature/<feature-name>
```

Create a pull request before merging changes into the main branch.

---

# Development Notes

- Do not commit `.env`
- Do not commit `.venv`
- Add new environment variable names to `.env.example`
- Add new Python dependencies to `requirements.txt`
- Keep shared backend utilities inside `backend/shared`
- Keep feature-specific logic inside the appropriate feature folder
