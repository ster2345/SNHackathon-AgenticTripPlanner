import React, { useState } from "react";
import { mockData } from "./mockData";

// ---------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------

function getUserName(userId) {
  const user = mockData.users.find((u) => u.user_id === userId);
  return user ? user.name : `User ${userId}`;
}

/* function getGroupPayments(groupId) {
  return mockData.payments.filter((p) => p.group_id === groupId);
}  */

function getGroupItinerary(groupId) {
  return mockData.itinerary.filter((i) => i.group_id === groupId);
}

// Groups itinerary rows by day number, in order
function groupByDay(itineraryRows) {
  const days = {};
  itineraryRows.forEach((row) => {
    if (!days[row.day]) days[row.day] = { date: row.date, activities: [] };
    days[row.day].activities.push(row);
  });
  return Object.entries(days).sort(([a], [b]) => Number(a) - Number(b));
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------

export default function Dashboard() {
  const [selectedGroupId, setSelectedGroupId] = useState(mockData.groups[0].group_id);
  // Local copy of payments so toggling "paid" updates the UI immediately.
  // Once real AWS data exists, this would come from an API call instead.
  const [payments, setPayments] = useState(mockData.payments);

  const selectedGroup = mockData.groups.find((g) => g.group_id === selectedGroupId);
  const itineraryByDay = groupByDay(getGroupItinerary(selectedGroupId));
  const groupPayments = payments.filter((p) => p.group_id === selectedGroupId);

  const togglePaid = (activityRef, fromUserId, toUserId) => {
    setPayments((prev) =>
      prev.map((p) =>
        p.group_id === selectedGroupId &&
        p.activity_ref === activityRef &&
        p.from_user_id === fromUserId &&
        p.to_user_id === toUserId
          ? { ...p, paid: !p.paid }
          : p
      )
    );
  };

  // Unpaid totals, grouped by (from, to) pair -- mirrors the backend logic
  const unpaidTotals = {};
  groupPayments.forEach((p) => {
    if (p.paid) return;
    const key = `${p.from_user_id}-${p.to_user_id}`;
    unpaidTotals[key] = (unpaidTotals[key] || 0) + p.amount_owed;
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Trip Dashboard</h1>
        <div style={styles.tripSwitcher}>
          {mockData.groups.map((g) => (
            <button
              key={g.group_id}
              onClick={() => setSelectedGroupId(g.group_id)}
              style={{
                ...styles.tripButton,
                ...(g.group_id === selectedGroupId ? styles.tripButtonActive : {}),
              }}
            >
              {g.trip_name}
            </button>
          ))}
        </div>
      </header>

      <section style={styles.tripMeta}>
        <p style={styles.destination}>{selectedGroup.destination}</p>
        <p style={styles.dates}>
          {selectedGroup.start_date} &rarr; {selectedGroup.end_date}
        </p>
        <p style={styles.inviteCode}>Invite code: {selectedGroup.invite_code}</p>
      </section>

      <div style={styles.columns}>
        {/* -------------------- Itinerary -------------------- */}
        <div style={styles.column}>
          <h2 style={styles.sectionTitle}>Itinerary</h2>
          {itineraryByDay.map(([dayNum, day]) => (
            <div key={dayNum} style={styles.dayBlock}>
              <div style={styles.dayHeading}>
                Day {dayNum} <span style={styles.dayDate}>{day.date}</span>
              </div>
              {day.activities.map((activity, idx) => (
                <div key={idx} style={styles.activityRow}>
                  <div style={styles.activityName}>{activity.activity}</div>
                  {activity.est_cost_per_person > 0 && (
                    <div style={styles.activityCost}>
                      ${activity.est_cost_per_person}/person &middot;{" "}
                      {activity.split_among_user_ids.map(getUserName).join(", ")}
                    </div>
                  )}
                  {activity.flag && <div style={styles.flag}>&#9888; {activity.flag}</div>}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* -------------------- Cost split & payments -------------------- */}
        <div style={styles.column}>
          <h2 style={styles.sectionTitle}>Who Owes What</h2>

          <div style={styles.summaryBox}>
            {Object.keys(unpaidTotals).length === 0 && (
              <p style={styles.allSettled}>Everyone's settled up.</p>
            )}
            {Object.entries(unpaidTotals).map(([key, amount]) => {
              const [fromId, toId] = key.split("-").map(Number);
              return (
                <div key={key} style={styles.summaryLine}>
                  <strong>{getUserName(fromId)}</strong> owes{" "}
                  <strong>{getUserName(toId)}</strong>
                  <span style={styles.summaryAmount}>${amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <h3 style={styles.subTitle}>Full ledger</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Activity</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Paid</th>
              </tr>
            </thead>
            <tbody>
              {groupPayments.map((p, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{p.activity_ref}</td>
                  <td style={styles.td}>{getUserName(p.from_user_id)}</td>
                  <td style={styles.td}>{getUserName(p.to_user_id)}</td>
                  <td style={styles.td}>${p.amount_owed}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => togglePaid(p.activity_ref, p.from_user_id, p.to_user_id)}
                      style={{
                        ...styles.paidToggle,
                        ...(p.paid ? styles.paidToggleOn : styles.paidToggleOff),
                      }}
                    >
                      {p.paid ? "Paid" : "Unpaid"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Styles (inline for a single-file starter -- feel free to move
// these into a CSS file later once the layout is settled)
// ---------------------------------------------------------------

const styles = {
  page: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "32px 24px",
    color: "#2B2B2B",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    borderBottom: "2px solid #E8641C",
    paddingBottom: "16px",
    marginBottom: "24px",
  },
  title: {
    fontSize: "28px",
    margin: 0,
    color: "#1F3A3D",
  },
  tripSwitcher: {
    display: "flex",
    gap: "8px",
  },
  tripButton: {
    padding: "8px 16px",
    borderRadius: "20px",
    border: "1px solid #1F3A3D",
    background: "white",
    color: "#1F3A3D",
    cursor: "pointer",
    fontSize: "14px",
  },
  tripButtonActive: {
    background: "#1F3A3D",
    color: "white",
  },
  tripMeta: {
    marginBottom: "24px",
  },
  destination: {
    fontSize: "18px",
    fontWeight: 600,
    margin: "0 0 4px 0",
  },
  dates: {
    margin: "0 0 4px 0",
    color: "#555",
  },
  inviteCode: {
    margin: 0,
    fontSize: "13px",
    color: "#888",
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "1.2fr 1fr",
    gap: "32px",
  },
  column: {
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: "20px",
    color: "#1F3A3D",
    marginBottom: "12px",
    borderBottom: "1px solid #ddd",
    paddingBottom: "6px",
  },
  dayBlock: {
    marginBottom: "18px",
  },
  dayHeading: {
    fontWeight: 700,
    marginBottom: "6px",
    color: "#E8641C",
  },
  dayDate: {
    fontWeight: 400,
    color: "#999",
    fontSize: "13px",
    marginLeft: "8px",
  },
  activityRow: {
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  activityName: {
    fontWeight: 500,
  },
  activityCost: {
    fontSize: "13px",
    color: "#666",
    marginTop: "2px",
  },
  flag: {
    fontSize: "13px",
    color: "#B25A00",
    marginTop: "4px",
    background: "#FFF3E6",
    padding: "4px 8px",
    borderRadius: "4px",
    display: "inline-block",
  },
  summaryBox: {
    background: "#F7F5F2",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "20px",
  },
  summaryLine: {
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 0",
    fontSize: "14px",
  },
  summaryAmount: {
    fontWeight: 700,
    color: "#E8641C",
  },
  allSettled: {
    margin: 0,
    color: "#3D7A4D",
    fontWeight: 500,
  },
  subTitle: {
    fontSize: "15px",
    color: "#555",
    marginBottom: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    borderBottom: "2px solid #ddd",
    padding: "6px 4px",
    color: "#555",
  },
  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "6px 4px",
  },
  paidToggle: {
    border: "none",
    borderRadius: "12px",
    padding: "4px 10px",
    fontSize: "12px",
    cursor: "pointer",
  },
  paidToggleOn: {
    background: "#E3F2E6",
    color: "#3D7A4D",
  },
  paidToggleOff: {
    background: "#FBE7E0",
    color: "#B23A00",
  },
};
