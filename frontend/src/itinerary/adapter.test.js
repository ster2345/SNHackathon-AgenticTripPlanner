import { plannerInput, itineraryRows } from './adapter';

test('maps profile strings and numeric identities without inventing availability or caps', () => {
  const input = plannerInput({ group_id: 1, trip_name: 'Osaka', destination: 'Osaka', start_date: '2026-11-14', end_date: '2026-11-17' },
    [{ user_id: 1, name: 'Alex', dietary_needs: 'Vegetarian', blacklist_food: 'Seafood', blacklist_activities: 'None' }],
    [{ group_id: 1, user_id: 1, budget_range: '$ (under $300)', date_flexibility: 'Flexible' }]);
  expect(input.users['1'].dietary_needs).toEqual(['Vegetarian']);
  expect(input.users['1'].blacklist).toEqual(['Seafood']);
  expect(input.members[0].user_id).toBe('1');
  expect(input.members[0].preferences).toBeNull();
});

test('maps planner output to dashboard rows without creating payments', () => {
  const rows = itineraryRows({ itinerary: { days: [{ date: '2026-11-14', activities: [{activity_id: 'a', title: 'Park', time: '09:00', participant_ids: ['1'], estimated_cost_per_person: 3.5 }] }] } }, 1, [{user_id: 1}]);
  expect(rows[0]).toMatchObject({ group_id: 1, activity_ref: 'a', est_cost_per_person: 3.5, split_among_user_ids: [1] });
  expect(rows[0].flag).toContain('Unverified');
});
