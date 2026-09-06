"""Render an account-scoped development policy. Does not attach anything in AWS.

python infrastructure/iam/render_person_b_policy.py --account-id 123456789012
Use the output as an additional policy in the selected SSO permission set.
"""
import argparse
import json
import re

MODEL = 'anthropic.claude-3-5-sonnet-20241022-v2:0'
PROFILE = 'apac.' + MODEL


def policy(account, region):
    if not re.fullmatch(r'\d{12}', account) or not re.fullmatch(r'[a-z]{2}-[a-z]+-\d', region):
        raise ValueError('Supply a 12-digit account ID and an AWS region.')
    table = lambda name: f'arn:aws:dynamodb:{region}:{account}:table/{name}'
    profile_arn = f'arn:aws:bedrock:{region}:{account}:inference-profile/{PROFILE}'
    return {'Version': '2012-10-17', 'Statement': [
        {'Sid': 'ReadPlannerInputs', 'Effect': 'Allow', 'Action': ['dynamodb:GetItem', 'dynamodb:Query', 'dynamodb:DescribeTable'],
         'Resource': [table(n) for n in ('Users', 'Groups', 'GroupMembers', 'Itinerary')]},
        {'Sid': 'SaveExistingMemberPreferences', 'Effect': 'Allow', 'Action': ['dynamodb:UpdateItem'], 'Resource': table('GroupMembers')},
        {'Sid': 'SaveItinerary', 'Effect': 'Allow', 'Action': ['dynamodb:PutItem'], 'Resource': table('Itinerary')},
        {'Sid': 'TeamSonnetProfile', 'Effect': 'Allow', 'Action': ['bedrock:InvokeModel', 'bedrock:GetInferenceProfile'],
         'Resource': profile_arn},
        {'Sid': 'TeamSonnetRoutedModels', 'Effect': 'Allow', 'Action': ['bedrock:InvokeModel'],
         'Resource': f'arn:aws:bedrock:*::foundation-model/{MODEL}',
         'Condition': {'StringEquals': {'bedrock:InferenceProfileArn': profile_arn}}},
    ]}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--account-id', required=True)
    parser.add_argument('--region', default='ap-southeast-1')
    args = parser.parse_args()
    print(json.dumps(policy(args.account_id, args.region), indent=2))
