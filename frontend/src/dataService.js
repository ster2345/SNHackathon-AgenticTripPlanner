// ---------------------------------------------------------------
// dataService.js
//
// SINGLE SOURCE OF TRUTH for all data access in this app.
// Every page should import functions from here, NOT reach into
// mockData.js directly.
//
// Why: right now everything is in-memory (backed by mockData.js).
// Once Person A's Cognito/DynamoDB and Person B's itinerary-agent
// Lambda are ready, we swap the INSIDE of these functions to call
// real API Gateway endpoints instead -- every page that already
// calls getGroups(), addGroup(), etc. keeps working with zero changes,
// because the function names/shapes stay the same.
//
// All functions are written as `async` and return Promises, even
// though the in-memory version doesn't strictly need to be async --
// this means pages already use `await`/.then() the same way they
// will once real network calls are involved, so there's no rewrite
// needed later, just a swap of what happens inside each function.
// ---------------------------------------------------------------

import { mockData } from "./mockData";
import { plannerInput, itineraryRows } from './itinerary/adapter';

// Deep-clone the initial mock data into mutable in-memory "tables".
// Using structuredClone so edits during the session don't mutate the
// original imported mockData object.
const STORAGE_KEY = "tripPlannerData";


function loadDatabase() {
  const savedData = localStorage.getItem(STORAGE_KEY);

  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch (error) {
      console.error("Failed to load saved data:", error);
    }
  }

  return structuredClone(mockData);
}


function saveDatabase() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(db)
  );
}


let db = loadDatabase();
// No real auth yet (that's Person A's Cognito work) -- hardcode
// "logged in as" Alex (user_id 1) for now. Swap this out once
// Cognito sessions exist.
const CURRENT_USER_ID = 1;

export function getCurrentUserId() {
  return CURRENT_USER_ID;
}

// ---------------------------------------------------------------
// Users
// ---------------------------------------------------------------

export async function getUsers() {
  return db.users;
}

export async function getUser(userId) {
  return db.users.find((u) => u.user_id === userId) || null;
}

export async function getCurrentUser() {
  return getUser(CURRENT_USER_ID);
}

export async function updateUser(userId, updates) {
  db.users = db.users.map((u) =>
    u.user_id === userId
      ? { ...u, ...updates }
      : u
  );

  saveDatabase();

  return getUser(userId);
}

// ---------------------------------------------------------------
// Groups (trips)
// ---------------------------------------------------------------

export async function getGroups() {
  return db.groups;
}

export async function getGroup(groupId) {
  return db.groups.find((g) => g.group_id === groupId) || null;
}

function generateInviteCode(destination, numPeople) {
  const lettersOnly = destination.replace(/[^A-Za-z]/g, "");
  const prefix = (lettersOnly.slice(0, 3).toUpperCase()).padEnd(3, "X");
  const peoplePart = String(numPeople);
  const randomDigits = String(Math.floor(Math.random() * 1000)).padStart(3, "0");
  return `${prefix}${peoplePart}${randomDigits}`;
}

// Creates a new trip group. Returns the created group (including its
// generated invite code) so the New Trip page can show/share it.
// organizerUserId defaults to CURRENT_USER_ID for backward compatibility,
// but pages should pass the actual "viewing as" user from UserContext.
export async function addGroup(
  { tripName, destination, startDate, endDate, expectedPeople },
  organizerUserId = CURRENT_USER_ID
) {
  const newGroupId = Math.max(0, ...db.groups.map((g) => g.group_id)) + 1;
  const inviteCode = generateInviteCode(destination, expectedPeople || 1);

  const newGroup = {
    group_id: newGroupId,
    trip_name: tripName,
    destination,
    start_date: startDate,
    end_date: endDate,
    invite_code: inviteCode,
    organizer_user_id: organizerUserId,
  };

  db.groups = [...db.groups, newGroup];

  db.groupMembers = [
    ...db.groupMembers,
    {
      group_id: newGroupId,
      user_id: organizerUserId,
      joined_at: new Date().toISOString(),
    },
  ];

  saveDatabase();


  return newGroup;
}

export async function joinGroup(inviteCode, userId = CURRENT_USER_ID) {
  const normalizedCode = inviteCode.trim().toUpperCase();

  const group = db.groups.find(
    (g) => g.invite_code.toUpperCase() === normalizedCode
  );

  if (!group) {
    throw new Error("Invalid invite code.");
  }

  const alreadyMember = db.groupMembers.some(
    (member) =>
      member.group_id === group.group_id &&
      member.user_id === userId
  );

  if (!alreadyMember) {
    db.groupMembers = [
      ...db.groupMembers,
      {
        group_id: group.group_id,
        user_id: userId,
        joined_at: new Date().toISOString(),
      },
    ];

    saveDatabase();
  }

  return group;
}

export async function getGroupMembers(groupId) {
  const memberships = db.groupMembers.filter(
    (member) => String(member.group_id) === String(groupId)
  );

  return memberships
    .map((membership) =>
      db.users.find((user) => user.user_id === membership.user_id)
    )
    .filter(Boolean);
}


export async function getUserGroups(userId) {
  const groupIds = db.groupMembers
    .filter((member) => member.user_id === userId)
    .map((member) => member.group_id);

  return db.groups.filter((group) =>
    groupIds.includes(group.group_id)
  );
}

// ---------------------------------------------------------------
// Itinerary
// ---------------------------------------------------------------

export async function getItinerary(groupId) {
  return db.itinerary.filter((i) => i.group_id === groupId);
}

// Host may supply {apiBase, getToken} using Person A's Cognito session.
// There is no automatic fallback to mock identity on a hosted site.
export async function connectPlanner(groupId, userId) {
  const config = window.TRIP_PLANNER_CONFIG;
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);
  const liveApi = !!config?.getToken;
  if (!liveApi && !local) throw new Error('Connect a Cognito session and API Gateway endpoint first.');
  const base = liveApi ? config.apiBase || '' : '';
  const request = async (path, method = 'GET', body) => {
    const headers = { 'Content-Type': 'application/json' };
    if (liveApi) {
      const token = await config.getToken();
      if (!token) throw new Error('Sign in to access this trip.');
      headers.Authorization = `Bearer ${token}`;
    } else headers['X-Demo-User'] = String(userId);
    const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    let data;
    try { data = await response.json(); } catch { throw new Error('Start the Python dashboard server or configure the API connection.'); }
    if (!response.ok) throw new Error(data.error || `Planner request failed (${response.status})`);
    return data;
  };
  if (!liveApi) {
    const group = await getGroup(groupId);
    if (!group) throw new Error('Trip not found.');
    const input = plannerInput(group, db.users, db.groupMembers);
    if (!input.members.some(m => m.user_id === String(userId))) throw new Error('Only trip members can open the planner.');
    await request('/demo/import', 'POST', input);
  }
  return { request };
}

export function savePlannerResult(record, groupId) {
  db.itinerary = [...db.itinerary.filter(row => row.group_id !== groupId), ...itineraryRows(record, groupId, db.users)];
  saveDatabase();
}

// ---------------------------------------------------------------
// Payments / Ledger
// ---------------------------------------------------------------

export async function getPayments(groupId) {
  return db.payments.filter((p) => p.group_id === groupId);
}

// Splits a cost among participants and appends the resulting ledger
// entries to the payments table. This is the JS port of the
// `calculate_split()` function in person_c_cost_split_lambda.py --
// same logic, so behaviour is consistent whether it runs here (in
// the browser, against mock/local data) or later in the real Lambda
// (against real DynamoDB data).
export async function addExpense({ groupId, description, totalCost, paidByUserId, participantIds }) {
  if (!participantIds || participantIds.length === 0) {
    throw new Error("At least one participant is required to split an expense.");
  }

  const share = Math.round((totalCost / participantIds.length) * 100) / 100;

  const newEntries = participantIds
    .filter((uid) => uid !== paidByUserId)
    .map((uid) => ({
      group_id: groupId,
      activity_ref: description,
      from_user_id: uid,
      to_user_id: paidByUserId,
      amount_owed: share,
      paid: false,
    }));

  db.payments = [...db.payments, ...newEntries];
  saveDatabase();

  return getPayments(groupId);
}

export async function togglePaymentStatus(groupId, activityRef, fromUserId, toUserId) {
  db.payments = db.payments.map((p) =>
    p.group_id === groupId &&
    p.activity_ref === activityRef &&
    p.from_user_id === fromUserId &&
    p.to_user_id === toUserId
      ? { ...p, paid: !p.paid }
      : p
  );
  saveDatabase();
  return getPayments(groupId);
}

// Marks ALL of one user's unpaid debts to another user as paid, across
// every trip/activity at once. Used by the "Settle Up" button on the
// Ledger page, where the person sees an aggregated total (e.g. "You
// owe Priya $32" combining several activities) rather than individual
// line items -- this settles that whole aggregated amount in one go,
// instead of requiring them to toggle each underlying activity
// separately via togglePaymentStatus.
export async function settleUp(fromUserId, toUserId) {
  db.payments = db.payments.map((p) =>
    p.from_user_id === fromUserId && p.to_user_id === toUserId && !p.paid
      ? { ...p, paid: true }
      : p
  );
  saveDatabase();
  return getUserLedger(fromUserId);
}

// Returns unpaid totals across ALL of a user's trips, grouped by
// (from, to) pair -- this powers the Ledger page. Splits debts the
// user owes from debts owed TO the user, since those read very
// differently on a personal ledger screen.
export async function getUserLedger(userId) {
  const owesOthers = {};
  const owedByOthers = {};

  db.payments.forEach((p) => {
    if (p.paid) return;

    if (p.from_user_id === userId) {
      const key = p.to_user_id;
      owesOthers[key] = (owesOthers[key] || 0) + p.amount_owed;
    }
    if (p.to_user_id === userId) {
      const key = p.from_user_id;
      owedByOthers[key] = (owedByOthers[key] || 0) + p.amount_owed;
    }
  });

  return { owesOthers, owedByOthers };
}

export function resetMockData() {
  db = structuredClone(mockData);

  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("currentUserId");
}
