import React from "react";
import { useNavigate } from "react-router-dom";
import { colors, card } from "../styles";

const sections = [
  {
    to: "/profile",
    title: "User Profile",
    description: "Your details, dietary needs, and activity preferences.",
  },
  {
    to: "/itineraries",
    title: "Itineraries",
    description: "See your existing trips, day-by-day plans, and flagged conflicts.",
  },
  {
    to: "/new-trip",
    title: "New Trip",
    description: "Start a trip and get an invite code to share with your group.",
  },
  {
    to: "/ledger",
    title: "Ledger",
    description: "See what you owe and what's owed to you, across every trip.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={styles.heading}>Where are we headed?</h1>
      <p style={styles.subheading}>
        Plan the trip, split the costs, and let the plan adjust itself when
        things change.
      </p>

      <div style={styles.grid}>
        {sections.map((section) => (
          <button
            key={section.to}
            onClick={() => navigate(section.to)}
            style={styles.card}
          >
            <div style={styles.cardTitle}>{section.title}</div>
            <div style={styles.cardDescription}>{section.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  heading: {
    fontSize: "30px",
    color: colors.ink,
    margin: "12px 0 4px 0",
  },
  subheading: {
    color: colors.textMuted,
    marginBottom: "28px",
    fontSize: "15px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  card: {
    ...card,
    textAlign: "left",
    cursor: "pointer",
    transition: "border-color 0.15s ease",
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: "17px",
    color: colors.ink,
    marginBottom: "6px",
  },
  cardDescription: {
    fontSize: "14px",
    color: colors.textMuted,
    lineHeight: 1.4,
  },
};
