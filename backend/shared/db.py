import os

import boto3
from dotenv import load_dotenv


# Load local environment variables from .env
load_dotenv()


AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")

dynamodb = boto3.resource(
    "dynamodb",
    region_name=AWS_REGION
)


def get_table(env_variable):
    table_name = os.getenv(env_variable)

    if not table_name:
        raise RuntimeError(
            f"Environment variable {env_variable} is not configured."
        )

    return dynamodb.Table(table_name)


def get_users_table():
    return get_table("USERS_TABLE")


def get_groups_table():
    return get_table("GROUPS_TABLE")


def get_group_members_table():
    return get_table("GROUP_MEMBERS_TABLE")