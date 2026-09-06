import React, { useState } from 'react';
import TripPlanner from './TripPlanner';
import './planner.css';
import { connectPlanner, savePlannerResult } from '../dataService';

export default function PlannerPanel({ groupId, userId, onSaved }) {
  const [connection, setConnection] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function connect() {
    setBusy(true); setError('');
    try { setConnection(await connectPlanner(groupId, userId)); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  if (!connection) return <section>
    <h3>Plan with the itinerary agent</h3>
    <p>Local testing copies this trip's members and profiles to the planner. Each member must enter budget, must-dos, and availability before generation. Original fixture budget notes are not treated as numeric caps.</p>
    <button onClick={connect} disabled={busy}>{busy ? 'Connecting…' : 'Open planner'}</button>
    {error && <p role="alert">{error}</p>}
  </section>;
  return <TripPlanner groupId={String(groupId)} request={connection.request}
    onItinerarySaved={async record => { savePlannerResult(record, groupId); await onSaved(); }} />;
}
