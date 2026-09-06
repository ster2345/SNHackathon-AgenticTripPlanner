import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TripPlanner from './TripPlanner';

test('uses host API for preferences and returns a saved plan to the dashboard', async () => {
  const state = { group: {name: 'Osaka', destination: 'Osaka', start_date: '2026-11-14', end_date: '2026-11-17', currency: 'SGD'},
    members: [{user_id: '1', name: 'Alex', submitted: true}], ready: true, preferences: {budget_level: '$', must_do: ['Parks'], available_from: '2026-11-14', available_to: '2026-11-17'}, itinerary: null };
  const record = {version: 1, source: 'bedrock', currency: 'SGD', itinerary: {days: [], flags: [], changes: [], estimated_totals: {by_member: {'1': 0}, group_total: 0}}};
  const request = jest.fn(async (path, method) => {
    if (method === 'POST') { state.itinerary = record; return record; }
    return {...state};
  });
  const saved = jest.fn();
  render(<TripPlanner groupId="1" request={request} onItinerarySaved={saved} />);
  await screen.findByDisplayValue('Parks');
  fireEvent.click(screen.getByRole('button', {name: 'Save preferences'}));
  await screen.findByText('Preferences saved.');
  expect(request).toHaveBeenCalledWith('/groups/1/preferences', 'PUT', expect.objectContaining({budget_level: '$'}));
  fireEvent.click(screen.getByRole('button', {name: 'Generate Itinerary'}));
  await waitFor(() => expect(saved).toHaveBeenCalledWith(record));
  expect(screen.getByText('Planned activity estimates')).toBeInTheDocument();
});
