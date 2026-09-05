import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addGroup } from "../dataService";
import { useCurrentUser } from "../UserContext";
import { colors, card, sectionTitle, input, label, button } from "../styles";

const initialForm = {
  tripName: "",
  destination: "",
  startDate: "",
  endDate: "",
  expectedPeople: 4,
};

export default function NewTrip() {
  const { currentUserId } = useCurrentUser();
  const [form, setForm] = useState(initialForm);
  const [createdGroup, setCreatedGroup] = useState(null);
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const value = field === "expectedPeople" ? Number(e.target.value) : e.target.value;
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newGroup = await addGroup(form, currentUserId);
    setCreatedGroup(newGroup);
  };

  if (createdGroup) {
    return (
      <div>
        <h2 style={sectionTitle}>Trip created</h2>
        <div style={{ ...card, textAlign: "center" }}>
          <p style={styles.confirmText}>
            <strong>{createdGroup.trip_name}</strong> is ready.
          </p>
          <div style={styles.codeBox}>{createdGroup.invite_code}</div>
          <p style={styles.codeHint}>
            Share this code so others can join the trip.
          </p>
          <div style={styles.actions}>
            <button
              style={{ ...button.base, ...button.primary }}
              onClick={() => navigate(`/itineraries/${createdGroup.group_id}`)}
            >
              View trip
            </button>
            <button
              style={{ ...button.base, ...button.secondary }}
              onClick={() => {
                setForm(initialForm);
                setCreatedGroup(null);
              }}
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={sectionTitle}>New Trip</h2>
      <form onSubmit={handleSubmit} style={card}>
        <label style={label}>Trip name</label>
        <input
          style={input}
          value={form.tripName}
          onChange={handleChange("tripName")}
          placeholder="e.g. Osaka Weekend"
          required
        />

        <label style={label}>Destination</label>
        <input
          style={input}
          value={form.destination}
          onChange={handleChange("destination")}
          placeholder="e.g. Osaka, Japan"
          required
        />

        <label style={label}>Start date</label>
        <input
          style={input}
          type="date"
          value={form.startDate}
          onChange={handleChange("startDate")}
          required
        />

        <label style={label}>End date</label>
        <input
          style={input}
          type="date"
          value={form.endDate}
          onChange={handleChange("endDate")}
          required
        />

        <label style={label}>Expected number of people</label>
        <input
          style={input}
          type="number"
          min="1"
          value={form.expectedPeople}
          onChange={handleChange("expectedPeople")}
        />

        <button type="submit" style={{ ...button.base, ...button.primary }}>
          Create trip &amp; generate invite code
        </button>
      </form>
    </div>
  );
}

const styles = {
  confirmText: {
    fontSize: "16px",
    marginBottom: "16px",
  },
  codeBox: {
    display: "inline-block",
    fontSize: "28px",
    fontWeight: 700,
    letterSpacing: "3px",
    color: colors.ink,
    background: colors.paper,
    padding: "12px 24px",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  codeHint: {
    fontSize: "13px",
    color: colors.textMuted,
    marginBottom: "20px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
  },
};
