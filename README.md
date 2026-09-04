# SNHackathon-AgenticTripPlanner

A group trip planning application that helps groups coordinate itineraries, preferences, and shared costs.

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

Additional services for the frontend, database, authentication, and AI components are still being finalised.

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