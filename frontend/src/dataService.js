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

// Deep-clone the initial mock data into mutable in-memory "tables".
// Using structuredClone so edits during the session don't mutate the
// original imported mockData object.
let db = structuredClone(mockData);

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
  db.users = db.users.map((u) => (u.user_id === userId ? { ...u, ...updates } : u));
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
  return newGroup;
}

// ---------------------------------------------------------------
// Itinerary
// ---------------------------------------------------------------

export async function getItinerary(groupId) {
  return db.itinerary.filter((i) => i.group_id === groupId);
}

// ---------------------------------------------------------------
// Payments / Ledger
// ---------------------------------------------------------------

export async function getPayments(groupId) {
  return db.payments.filter((p) => p.group_id === groupId);
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
  return getPayments(groupId);
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
