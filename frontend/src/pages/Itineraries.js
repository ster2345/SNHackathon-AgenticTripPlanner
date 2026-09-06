import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getGroups } from "../dataService";
import { colors, card, sectionTitle } from "../styles";

export default function Itineraries() {
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  return (
    <div>
      <h2 style={sectionTitle}>Your Itineraries</h2>

      {groups.length === 0 && <p>No trips yet. Start one from "New Trip".</p>}

      <div style={styles.grid}>
        {groups.map((g) => (
          <button
            key={g.group_id}
            style={styles.card}
            onClick={() => navigate(`/itineraries/${g.group_id}`)}
          >
            <div style={styles.tripName}>{g.trip_name}</div>
            <div style={styles.destination}>{g.destination}</div>
            <div style={styles.dates}>
              {g.start_date} &rarr; {g.end_date}
            </div>
            <div style={styles.inviteCode}>Code: {g.invite_code}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    ...card,
    textAlign: "left",
    cursor: "pointer",
  },
  tripName: {
    fontWeight: 700,
    fontSize: "17px",
    color: colors.ink,
    marginBottom: "4px",
  },
  destination: {
    fontSize: "14px",
    color: colors.textMuted,
    marginBottom: "6px",
  },
  dates: {
    fontSize: "13px",
    color: colors.textMuted,
    marginBottom: "8px",
  },
  inviteCode: {
    fontSize: "12px",
    color: colors.accent,
    fontWeight: 600,
  },
};
