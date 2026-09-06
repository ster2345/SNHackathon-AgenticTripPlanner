import copy
import unittest
from backend.itinerary.dashboard_demo import DashboardStore
from backend.itinerary.aws_check import validate_table
from backend.itinerary.demo import fixture_model
from backend.itinerary.service import ItineraryService
from backend.itinerary.planner import Problem


class DashboardBridgeTests(unittest.TestCase):
    def setUp(self):
        self.body = {'group': {'group_id': '1', 'name': 'Osaka', 'destination': 'Osaka, Japan',
                    'start_date': '2026-11-14', 'end_date': '2026-11-17', 'currency': 'SGD'},
                    'users': {'1': {'name': 'Alex', 'dietary_needs': ['Vegetarian'], 'blacklist': []}},
                    'members': [{'user_id': '1'}]}

    def test_dashboard_import_save_generate_and_refresh_preserves_preferences(self):
        store = DashboardStore(self.body)
        service = ItineraryService(store, fixture_model, 'demo-fixture')
        self.assertFalse(service.state('1', '1')['ready'])
        service.save_preferences('1', '1', {'budget_level': '$', 'must_do': ['Parks'],
                                 'available_from': '2026-11-14', 'available_to': '2026-11-17'})
        service.plan('1', '1')
        store.update(self.body)
        self.assertTrue(service.state('1', '1')['ready'])
        self.assertFalse(service.state('1', '1')['stale'])
        changed = copy.deepcopy(self.body)
        changed['users']['1']['dietary_needs'].append('No eggs')
        store.update(changed)
        self.assertTrue(service.state('1', '1')['stale'])

    def test_seven_days_rejected_and_profile_not_silently_ignored(self):
        self.body['group']['end_date'] = '2026-11-20'
        with self.assertRaises(Problem): DashboardStore(self.body)
        self.body['group']['end_date'] = '2026-11-17'
        self.body['users']['1']['dietary_needs'] = 'Vegetarian'
        with self.assertRaises(Problem): DashboardStore(self.body)

    def test_numeric_dynamodb_keys_are_rejected(self):
        table = {'KeySchema': [{'AttributeName': 'user_id', 'KeyType': 'HASH'}],
                 'AttributeDefinitions': [{'AttributeName': 'user_id', 'AttributeType': 'N'}]}
        self.assertFalse(validate_table(table, [('user_id', 'HASH')]))
        table['AttributeDefinitions'][0]['AttributeType'] = 'S'
        self.assertTrue(validate_table(table, [('user_id', 'HASH')]))
