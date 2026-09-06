import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { joinGroup } from "../dataService";
import { useCurrentUser } from "../UserContext";
import {
  card,
  sectionTitle,
  input,
  label,
  button,
  colors,
} from "../styles";


export default function JoinTrip() {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const { currentUserId } = useCurrentUser();
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const group = await joinGroup(inviteCode, currentUserId);

      navigate(`/itineraries/${group.group_id}`);
    } catch (err) {
      setError(err.message);
    }
  };


  return (
    <div>
      <h2 style={sectionTitle}>Join a Trip</h2>

      <form onSubmit={handleSubmit} style={card}>
        <label style={label}>Invite code</label>

        <input
          style={input}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="e.g. OSK4TRIP"
          required
        />

        {error && (
          <p style={{ color: colors.danger || "crimson" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          style={{ ...button.base, ...button.primary }}
        >
          Join trip
        </button>
      </form>
    </div>
  );
}