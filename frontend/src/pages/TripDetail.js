import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGroup, getItinerary, getUsers } from "../dataService";
import { colors, card, sectionTitle, button } from "../styles";

function groupByDay(itineraryRows) {
  const days = {};
  itineraryRows.forEach((row) => {
    if (!days[row.day]) days[row.day] = { date: row.date, activities: [] };
    days[row.day].activities.push(row);
  });
  return Object.entries(days).sort(([a], [b]) => Number(a) - Number(b));
}

// ---------------------------------------------------------------
// PLACEHOLDER day summary generator.
//
// This is a simple rule-based sentence builder, NOT real AI --
// it exists so the UI has something to show in this slot right now.
//
// Eventually, Person B's itinerary-generation agent (Claude via
// Bedrock) should produce this summary itself as part of its output
// for each day, based on the group's actual stated preferences
// (e.g. "Day 3 leans into everyone's hiking preference, but note
// Sam and Priya opted out for shopping instead"). Once that field
// exists on each day's data, swap this function out for simply
// reading `day.summary` (or whatever field name B's JSON uses)
// instead of generating one here.
// ---------------------------------------------------------------
function summarizeDay(day) {
  const count = day.activities.length;
  const flagCount = day.activities.filter((a) => a.flag).length;
  const totalCost = day.activities.reduce((sum, a) => sum + (a.est_cost_per_person || 0), 0);
  const mainActivities = day.activities
    .filter((a) => a.est_cost_per_person > 0 || day.activities.length <= 2)
    .slice(0, 2)
    .map((a) => a.activity)
    .join(" and ");

  let summary = `${count} activit${count === 1 ? "y" : "ies"}`;
  if (mainActivities) summary += ` — ${mainActivities}`;
  if (totalCost > 0) summary += ` · ~$${totalCost}/person`;
  if (flagCount > 0) summary += ` · ${flagCount} flag${flagCount > 1 ? "s" : ""} to check`;

  return summary;
}

export default function TripDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [itinerary, setItinerary] = useState([]);
  const [users, setUsers] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    const id = Number(groupId);
    getGroup(id).then(setGroup);
    getItinerary(id).then(setItinerary);
    getUsers().then(setUsers);
  }, [groupId]);

  if (!group) return <p>Loading trip...</p>;

  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || `User ${id}`;
  const days = groupByDay(itinerary);
  const totalFlags = itinerary.filter((i) => i.flag).length;
  const totalEstCost = itinerary.reduce((sum, i) => sum + (i.est_cost_per_person || 0), 0);

  return (
    <div>
      <button style={styles.backLink} onClick={() => navigate("/itineraries")}>
        &larr; Back to itineraries
      </button>

      <h2 style={{ ...sectionTitle, marginTop: "8px" }}>{group.trip_name}</h2>

      {/* --- Summary --- */}
      <div style={{ ...card, ...styles.summaryCard }}>
        <div style={styles.summaryRow}>
          <div>
            <div style={styles.summaryLabel}>Destination</div>
            <div style={styles.summaryValue}>{group.destination}</div>
          </div>
          <div>
            <div style={styles.summaryLabel}>Dates</div>
            <div style={styles.summaryValue}>
              {group.start_date} &rarr; {group.end_date}
            </div>
          </div>
          <div>
            <div style={styles.summaryLabel}>Invite code</div>
            <div style={styles.summaryValue}>{group.invite_code}</div>
          </div>
          <div>
            <div style={styles.summaryLabel}>Est. total per person</div>
            <div style={styles.summaryValue}>${totalEstCost}</div>
          </div>
        </div>
        {totalFlags > 0 && (
          <div style={styles.flagBanner}>
            &#9888; {totalFlags} potential conflict{totalFlags > 1 ? "s" : ""} flagged below
          </div>
        )}
      </div>

      {/* --- Day list, expandable --- */}
      <h3 style={{ ...sectionTitle, fontSize: "17px", marginTop: "24px" }}>
        Day by day
      </h3>

      {days.map(([dayNum, day]) => {
        const isOpen = expandedDay === dayNum;
        const dayFlags = day.activities.filter((a) => a.flag).length;
        return (
          <div key={dayNum} style={card}>
            <button
              style={styles.dayHeaderButton}
              onClick={() => setExpandedDay(isOpen ? null : dayNum)}
            >
              <span style={styles.dayHeaderLeft}>
                <span style={styles.dayTitle}>
                  Day {dayNum} <span style={styles.dayDate}>{day.date}</span>
                </span>
                <span style={styles.daySummary}>{summarizeDay(day)}</span>
              </span>
              <span style={styles.dayMeta}>
                {dayFlags > 0 && <span style={styles.dayFlagBadge}>{dayFlags} flag{dayFlags > 1 ? "s" : ""}</span>}
                <span style={styles.chevron}>{isOpen ? "\u2212" : "+"}</span>
              </span>
            </button>

            {isOpen && (
              <div style={styles.dayDetail}>
                {day.activities.map((activity, idx) => (
                  <div key={idx} style={styles.activityBlock}>
                    <div style={styles.activityName}>{activity.activity}</div>
                    <div style={styles.activityMetaRow}>
                      {activity.est_cost_per_person > 0 && (
                        <span style={styles.metaChip}>
                          ${activity.est_cost_per_person}/person
                        </span>
                      )}
                      <span style={styles.metaChip}>
                        {activity.split_among_user_ids.map(getUserName).join(", ")}
                      </span>
                    </div>
                    {activity.flag && (
                      <div style={styles.flag}>&#9888; {activity.flag}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  backLink: {
    background: "none",
    border: "none",
    color: colors.accent,
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    marginBottom: "8px",
  },
  summaryCard: {
    background: colors.paper,
  },
  summaryRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    marginBottom: "8px",
  },
  summaryLabel: {
    fontSize: "12px",
    color: colors.textMuted,
    marginBottom: "2px",
  },
  summaryValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: colors.ink,
  },
  flagBanner: {
    marginTop: "10px",
    fontSize: "13px",
    color: colors.warn,
    background: colors.warnBg,
    padding: "8px 12px",
    borderRadius: "6px",
    display: "inline-block",
  },
  dayHeaderButton: {
    width: "100%",
    background: "none",
    border: "none",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    padding: 0,
    fontSize: "15px",
    textAlign: "left",
  },
  dayHeaderLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  dayTitle: {
    fontWeight: 700,
    color: colors.ink,
  },
  daySummary: {
    fontSize: "12.5px",
    fontWeight: 400,
    color: colors.textMuted,
  },
  dayDate: {
    fontWeight: 400,
    fontSize: "13px",
    color: colors.textMuted,
    marginLeft: "8px",
  },
  dayMeta: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  dayFlagBadge: {
    fontSize: "12px",
    background: colors.warnBg,
    color: colors.warn,
    padding: "3px 8px",
    borderRadius: "10px",
  },
  chevron: {
    fontSize: "18px",
    color: colors.accent,
    fontWeight: 700,
  },
  dayDetail: {
    marginTop: "14px",
    borderTop: `1px solid ${colors.border}`,
    paddingTop: "12px",
  },
  activityBlock: {
    marginBottom: "12px",
  },
  activityName: {
    fontWeight: 600,
    fontSize: "14px",
    marginBottom: "4px",
  },
  activityMetaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  metaChip: {
    fontSize: "12px",
    color: colors.textMuted,
    background: colors.paper,
    padding: "3px 8px",
    borderRadius: "10px",
  },
  flag: {
    fontSize: "13px",
    color: colors.warn,
    background: colors.warnBg,
    padding: "6px 10px",
    borderRadius: "6px",
    marginTop: "6px",
    display: "inline-block",
  },
};
