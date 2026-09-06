"""Loopback-only bridge for the team's dashboard fixtures. Never imported by Lambda."""
import copy
from .demo import DemoStore
from .planner import Problem, iso_date, text


class DashboardStore(DemoStore):
    def __init__(self, body):
        self.current = None
        self.people = []
        self.update(body)

    def update(self, body):
        group, users, members = body.get('group'), body.get('users'), body.get('members')
        if not isinstance(group, dict) or not isinstance(users, dict) or not isinstance(members, list) or not 1 <= len(members) <= 20:
            raise Problem('A demo trip needs a group, profiles, and one to twenty members.')
        group = {key: text(group.get(key), key, 150) for key in ('group_id', 'name', 'destination', 'start_date', 'end_date', 'currency')}
        start, end = iso_date(group['start_date']), iso_date(group['end_date'])
        if not 1 <= (end-start).days + 1 <= 5:
            raise Problem('The planner supports one to five days. Choose the Osaka demo or shorten this trip.')
        people = []
        old = {m['user_id']: m for m in self.people}
        seen = set()
        for m in members:
            if not isinstance(m, dict):
                raise Problem('Invalid membership.')
            uid = text(m.get('user_id'), 'user_id', 100)
            if uid in seen or uid not in users or not isinstance(users[uid], dict):
                raise Problem('Each member needs one unique profile.')
            seen.add(uid)
            text(users[uid].get('name'), 'name', 100)
            for key in ('dietary_needs', 'blacklist'):
                if not isinstance(users[uid].get(key), list) or len(users[uid][key]) > 30:
                    raise Problem(f'{key} must be a list of at most 30 strings.')
                for item in users[uid][key]:
                    text(item, key, 150)
            people.append({'group_id': group['group_id'], 'user_id': uid, 'status': 'active',
                           'preferences': copy.deepcopy(old.get(uid, {}).get('preferences'))})
        self.group_data, self.profiles, self.people = copy.deepcopy(group), copy.deepcopy(users), people

    def group(self, gid):
        if gid != self.group_data['group_id']:
            raise Problem('Trip not found.', 404)
        return copy.deepcopy(self.group_data)

    def users(self, members):
        return copy.deepcopy(self.profiles)
