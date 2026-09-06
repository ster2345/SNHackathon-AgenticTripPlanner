import React from 'react';
import { createRoot } from 'react-dom/client';
import TripPlanner from './TripPlanner.jsx';
import '../style.css';
const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
const config = window.TRIP_PLANNER_CONFIG || (local ? { groupId: 'osaka', demo: true } : null);
createRoot(document.getElementById('root')).render(config ? <TripPlanner key={config.groupId} {...config} />
  : <main><section><h1>Open a trip from your group page</h1><p>Sign in and select a group to plan an itinerary.</p></section></main>);
