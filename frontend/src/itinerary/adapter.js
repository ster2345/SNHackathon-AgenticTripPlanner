// Explicit conversion between the team's spreadsheet fixtures and the planner contract.
export function textList(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(',');
  return values.map(v => String(v).trim()).filter(v => v && v.toLowerCase() !== 'none');
}

export function plannerInput(group, users, preferences) {
  const rows = preferences.filter(p => p.group_id === group.group_id);
  return {
    group: { group_id: String(group.group_id), name: group.trip_name, destination: group.destination,
      start_date: group.start_date, end_date: group.end_date, currency: group.currency || 'SGD' },
    users: Object.fromEntries(rows.map(p => {
      const u = users.find(u => u.user_id === p.user_id);
      if (!u) throw new Error(`Missing profile for member ${p.user_id}`);
      return [String(u.user_id), { name: u.name, dietary_needs: textList(u.dietary_needs),
        blacklist: [...textList(u.blacklist_activities), ...textList(u.blacklist_food)] }];
    })),
    members: rows.map(p => ({ group_id: String(group.group_id), user_id: String(p.user_id), status: 'active',
      // Date flexibility text is not an availability range. Collect dates explicitly in the form.
      // Budget text can contain numeric caps: do not silently discard them during conversion.
      preferences: null })),
  };
}

export function itineraryRows(record, dashboardGroupId, users) {
  const idMap = new Map(users.map(u => [String(u.user_id), u.user_id]));
  return record.itinerary.days.flatMap((day, index) => day.activities.map(a => ({
    group_id: dashboardGroupId, day: index + 1, date: day.date, activity: `${a.time} - ${a.title}`,
    activity_ref: a.activity_id, est_cost_per_person: a.estimated_cost_per_person,
    split_among_user_ids: a.participant_ids.map(id => idMap.get(id) ?? id),
    flag: 'Unverified suggestion. Check venue, dietary suitability, route difficulty, and availability.',
  })));
}
