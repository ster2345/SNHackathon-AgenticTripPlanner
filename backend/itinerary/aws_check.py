"""Read-only AWS setup check: python -m backend.itinerary.aws_check --profile PERSONAL_PROFILE.

Checks identity, configured model metadata and DynamoDB table keys. Does not invoke
Claude, create tables, change IAM, or claim that metadata checks prove write access.
"""
import argparse
import os

TABLE_KEYS = {
    'USERS_TABLE': ('Users', [('user_id', 'HASH')]),
    'GROUPS_TABLE': ('Groups', [('group_id', 'HASH')]),
    'GROUP_MEMBERS_TABLE': ('GroupMembers', [('group_id', 'HASH'), ('user_id', 'RANGE')]),
    'ITINERARY_TABLE': ('Itinerary', [('group_id', 'HASH')]),
}


def validate_table(table, keys):
    actual = {(k['AttributeName'], k['KeyType']) for k in table['KeySchema']}
    types = {a['AttributeName']: a['AttributeType'] for a in table['AttributeDefinitions']}
    return actual == set(keys) and all(types.get(name) == 'S' for name, _ in keys)


def main():
    import boto3
    from botocore.config import Config
    from botocore.exceptions import BotoCoreError, ClientError
    from dotenv import load_dotenv
    load_dotenv()
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--profile', required=True, help='Explicit AWS CLI profile name; not a password')
    args = parser.parse_args()
    region = os.environ.get('AWS_REGION') or 'ap-southeast-1'
    try:
        session = boto3.Session(profile_name=args.profile, region_name=region)
        config = Config(connect_timeout=10, read_timeout=20, retries={'max_attempts': 0})
        identity = session.client('sts', config=config).get_caller_identity()
        print('Account:', identity['Account'])
        print('Identity:', identity['Arn'])
        print('Region:', region)
        failures = 0
        model = os.environ.get('BEDROCK_MODEL_ID', '')
        try:
            bedrock = session.client('bedrock', config=config)
            if model.startswith('anthropic.'):
                details = bedrock.get_foundation_model(modelIdentifier=model)['modelDetails']
                print('Model lifecycle:', details.get('modelLifecycle', {}).get('status', 'unknown'))
                print('Inference types:', details.get('inferenceTypesSupported', []))
            else:
                bedrock.get_inference_profile(inferenceProfileIdentifier=model)
                print('Inference profile metadata accessible.')
        except (BotoCoreError, ClientError) as exc:
            print('Model metadata check failed:', type(exc).__name__)
            failures += 1
        db = session.client('dynamodb', config=config)
        for env, (default, keys) in TABLE_KEYS.items():
            name = os.environ.get(env) or default
            try:
                table = db.describe_table(TableName=name)['Table']
                valid = validate_table(table, keys)
                print(name + ':', 'keys match' if valid else 'KEY MISMATCH (expected string keys)')
                failures += int(not valid)
            except ClientError as exc:
                print(name + ':', exc.response['Error']['Code'])
                failures += 1
        print('No data or permissions changed. Run the Claude smoke test separately; table writes remain untested.')
        return int(failures > 0)
    except (BotoCoreError, ClientError) as exc:
        print('AWS login check failed:', type(exc).__name__, '- configure/login to the named profile first.')
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
