import { addGroup, joinGroup, connectPlanner, getPayments, getItinerary, savePlannerResult } from '../dataService';

test('joining a trip adds the new member to the planner with pending preferences', async () => {
  global.fetch = jest.fn(async () => ({ok: true, json: async () => ({status: 'imported'})}));
  const group = await addGroup({tripName: 'Joined trip', destination: 'Osaka', startDate: '2026-11-14', endDate: '2026-11-16'}, 1);
  await joinGroup(group.invite_code, 2);
  await joinGroup(group.invite_code, 2);
  await connectPlanner(group.group_id, 2);
  const payload = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(payload.members.map(member => member.user_id)).toEqual(['1', '2']);
  expect(payload.members.every(member => member.preferences === null)).toBe(true);
});

afterEach(() => { delete window.TRIP_PLANNER_CONFIG; delete global.fetch; });

test('new-trip organizer can import the local trip with pending preferences', async () => {
  global.fetch = jest.fn(async () => ({ok: true, json: async () => ({status: 'imported'})}));
  const group = await addGroup({tripName: 'New trip', destination: 'Osaka', startDate: '2026-11-14', endDate: '2026-11-16', expectedPeople: 1}, 1);
  await connectPlanner(group.group_id, 1);
  const [path, options] = global.fetch.mock.calls[0];
  expect(path).toBe('/demo/import');
  expect(JSON.parse(options.body).members).toEqual([{group_id: String(group.group_id), user_id: '1', status: 'active', preferences: null}]);
});

test('saved planner estimates update the dashboard but leave payment balances untouched', async () => {
  const before = JSON.stringify(await getPayments(1));
  savePlannerResult({itinerary: {days: [{date: '2026-11-14', activities: [{activity_id: 'park', title: 'Park', time: '10:00', participant_ids: ['1'], estimated_cost_per_person: 2}]}]}}, 1);
  expect((await getItinerary(1))[0].split_among_user_ids).toEqual([1]);
  expect(JSON.stringify(await getPayments(1))).toBe(before);
});

test('authenticated API requests use the token without local demo identity or import', async () => {
  window.TRIP_PLANNER_CONFIG = {apiBase: 'https://example.invalid', getToken: async () => 'test-token'};
  global.fetch = jest.fn(async () => ({ok: true, json: async () => ({ready: true})}));
  const {request} = await connectPlanner(1, 1);
  expect(global.fetch).not.toHaveBeenCalled();
  await request('/groups/1/itinerary');
  const [, options] = global.fetch.mock.calls[0];
  expect(options.headers.Authorization).toBe('Bearer test-token');
  expect(options.headers['X-Demo-User']).toBeUndefined();
});
