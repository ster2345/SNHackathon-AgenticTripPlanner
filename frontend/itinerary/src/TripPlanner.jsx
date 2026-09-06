import React, { useEffect, useRef, useState } from 'react';

export default function TripPlanner({ groupId, apiBase = '', getToken, demo = false, onItinerarySaved }) {
  const [state, setState] = useState(null), [user, setUser] = useState('alex');
  const [form, setForm] = useState({ budget_level: '$', must_do: ['', '', ''], available_from: '', available_to: '' });
  const [reason, setReason] = useState(''), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ message: '', error: false });
  const inFlight = useRef(false), version = useRef(0);
  const notify = (message, error = false) => setNotice({ message, error });
  const route = suffix => `/groups/${encodeURIComponent(groupId)}/${suffix}`;
  async function api(path, method = 'GET', body, identity = user) {
    const headers = { 'Content-Type': 'application/json' };
    if (demo) headers['X-Demo-User'] = identity;
    else { const token = await getToken?.(); if (!token) throw new Error('Sign in before accessing this group.'); headers.Authorization = `Bearer ${token}`; }
    const response = await fetch(`${apiBase.replace(/\/$/, '')}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let data;
    try { data = await response.json(); } catch { throw new Error('The trip API returned an unreadable response. Check the API connection.'); }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
    return data;
  }
  function accept(data) {
    setState(data); const p = data.preferences;
    setForm({ budget_level: p?.budget_level || '$', must_do: [0, 1, 2].map(i => p?.must_do[i] || ''),
      available_from: p?.available_from || data.group.start_date, available_to: p?.available_to || data.group.end_date });
  }
  async function run(action, message) {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); notify(message);
    try { await action(); } catch (error) { notify(error.message, true); }
    finally { inFlight.current = false; setBusy(false); }
  }
  useEffect(() => {
    const request = ++version.current;
    setState(null); setBusy(true); inFlight.current = true; notify('Loading trip…');
    api(route('itinerary')).then(data => { if (version.current === request) { accept(data); notify(''); } })
      .catch(error => { if (version.current === request) notify(error.message, true); })
      .finally(() => { if (version.current === request) { setBusy(false); inFlight.current = false; } });
    return () => { version.current++; };
  }, [groupId, apiBase, demo, getToken]);
  const name = id => state?.members.find(m => m.user_id === id)?.name || id;
  const disabled = busy || !state, record = state?.itinerary, itinerary = record?.itinerary;
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  function save(event) {
    event.preventDefault();
    if (form.available_to < form.available_from) return notify('Available-to date must be on or after available-from date.', true);
    run(async () => { accept(await api(route('preferences'), 'PUT', { ...form, must_do: form.must_do.map(a => a.trim()).filter(Boolean) })); notify('Preferences saved.'); }, 'Saving preferences…');
  }
  function plan(recalculate) {
    run(async () => {
      const saved = await api(route(recalculate ? 'itinerary/recalculate' : 'itinerary'), 'POST', { reason });
      accept(await api(route('itinerary'))); setReason(''); notify('Draft saved. Review the itinerary and heads up before booking.');
      if (onItinerarySaved) try { await onItinerarySaved(saved); } catch { notify('Draft saved, but the group dashboard could not refresh. Reload the dashboard.', true); }
    }, 'Planning your trip… this may take a minute.');
  }
  function switchMember(identity) {
    run(async () => { const data = await api(route('itinerary'), 'GET', undefined, identity); setUser(identity); accept(data); notify(''); }, 'Loading preferences…');
  }
  function attendance(id, active) {
    run(async () => {
      await api('/demo/membership', 'POST', { user_id: id, active });
      const next = !active && user === id ? 'alex' : user;
      setUser(next); accept(await api(route('itinerary'), 'GET', undefined, next)); notify('Group updated. Recalculate to revise the itinerary.');
    }, 'Updating demo members…');
  }
  return <>
    <header><span className="brand">GROUP TRIP / PLANNER</span><h1>{state?.group.name || 'Trip preferences & itinerary'}</h1>{state && <p>{state.group.destination} · {state.group.start_date} — {state.group.end_date} · {state.group.currency}</p>}</header>
    <main><aside>
      {demo && <section id="demo-controls"><p className="eyebrow">LOCAL DEMO</p><p>Sample members · {state?.source === 'bedrock' ? 'live Claude' : 'fixture output, no AI'} · resets on restart</p>
        <label htmlFor="member">View as</label><select id="member" value={user} disabled={disabled} onChange={e => switchMember(e.target.value)}>{['alex', 'sam', 'priya'].map(id => <option key={id} value={id} disabled={!!state && !state.members.some(m => m.user_id === id)}>{id[0].toUpperCase() + id.slice(1)}</option>)}</select>
        <details><summary>Simulate a member leaving</summary>{['sam', 'priya'].map(id => <label key={id}><input type="checkbox" disabled={disabled} checked={!!state?.members.some(m => m.user_id === id)} onChange={e => attendance(id, e.target.checked)} /> {id === 'sam' ? 'Sam' : 'Priya'} is attending</label>)}</details></section>}
      <section><h2>Your preferences</h2><form onSubmit={save}><fieldset disabled={disabled}>
        <label htmlFor="budget">Budget</label><select id="budget" value={form.budget_level} onChange={e => change('budget_level', e.target.value)}><option value="$">$ · Economical</option><option value="$$">$$ · Moderate</option><option value="$$$">$$$ · Premium</option></select>
        <label htmlFor="activity-0">Must-do activities <span>(up to 3)</span></label>{form.must_do.map((value, i) => <input key={i} id={`activity-${i}`} aria-label={`Must-do activity ${i + 1}`} maxLength={100} required={i === 0} value={value} placeholder={i === 0 ? 'e.g. Parks' : 'Optional activity'} onChange={e => change('must_do', form.must_do.map((a, index) => index === i ? e.target.value : a))} />)}
        <label htmlFor="from">Available from</label><input id="from" type="date" required value={form.available_from} onChange={e => change('available_from', e.target.value)} />
        <label htmlFor="to">Available to</label><input id="to" type="date" required min={form.available_from} value={form.available_to} onChange={e => change('available_to', e.target.value)} /><button type="submit">Save preferences</button>
      </fieldset></form></section>
    </aside><div className="planning">
      <section><div className="section-heading"><h2>The group</h2><span>{state ? `${state.members.filter(m => m.submitted).length}/${state.members.length} submitted` : ''}</span></div>
        <div className="members">{state?.members.map(m => <span className="pill" key={m.user_id}>{m.name} · {m.submitted ? 'Ready' : 'Pending'}</span>)}</div>
        <p>{state?.stale ? 'Preferences or members changed. Recalculate to update this draft.' : state?.readiness_error || (state ? 'Everyone is ready to plan.' : '')}</p>
        <div className="actions"><button disabled={disabled || !state?.ready || !!record} onClick={() => plan(false)}>Generate Itinerary</button><button className="secondary" disabled={disabled || !state?.ready || !record} onClick={() => plan(true)}>Recalculate Itinerary</button></div>
        <label htmlFor="reason">What changed? <span>(optional)</span></label><input id="reason" disabled={disabled} maxLength={1000} value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Sam left, or we want a quieter afternoon" /></section>
      <p id="status" role="status" aria-live="polite" className={notice.error ? 'error' : ''}>{notice.message}</p>
      {!state && !busy && <button onClick={() => run(async () => { accept(await api(route('itinerary'))); notify(''); }, 'Loading trip…')}>Retry connection</button>}
      {!!itinerary?.flags.length && <section className="flags"><h2>Heads up</h2><ul>{itinerary.flags.map((flag, i) => <li key={i}>{flag.issue} ({flag.affected_members.map(name).join(', ')})</li>)}</ul></section>}
      {!!itinerary?.changes.length && <section><h2>Here’s what changed</h2><ul>{itinerary.changes.map((item, i) => <li key={i}>{item}</li>)}</ul></section>}
      <div className="section-heading"><h2>Your itinerary</h2><span>{record && `Version ${record.version} · ${record.source === 'demo-fixture' ? 'Demo fixture' : 'Claude draft'}`}</span></div>
      {!record && <p id="empty">Save everyone’s preferences, then generate your first draft.</p>}
      {itinerary?.estimated_totals && <section><h2>Planned activity estimates</h2>
        <div className="members">{Object.entries(itinerary.estimated_totals.by_member).map(([id, amount]) => <span className="pill" key={id}>{name(id)} · {record.currency} {amount.toFixed(2)}</span>)}</div>
        <p>Group total: {record.currency} {itinerary.estimated_totals.group_total.toFixed(2)}</p>
        <p className="muted">Calculated from assigned activities only. Excludes any unlisted flights, lodging, transport, or purchases. These are not payment balances.</p>
      </section>}
      {itinerary?.days.map((day, i) => <section key={day.date}><h2>Day {i + 1} · {day.date}</h2>{day.activities.map(a => <article className="activity" key={a.activity_id}><h3>{a.time} · {a.title}</h3><p className="activity-meta"><strong>Unverified suggestion</strong> - Confirm venue, menu, opening hours, route difficulty, and accessibility before booking.</p><p>{a.description}</p><p>{a.reason}</p><p className="activity-meta">{a.participant_ids.map(name).join(', ')} · {record.currency} {a.estimated_cost_per_person.toFixed(2)} / person, estimated</p><p className="activity-meta">{a.dietary_notes}</p></article>)}</section>)}
      <p className="muted">Draft suggestions only. Prices are estimates; confirm venues, availability, and dietary accommodations before booking.</p>
    </div></main>
  </>;
}
