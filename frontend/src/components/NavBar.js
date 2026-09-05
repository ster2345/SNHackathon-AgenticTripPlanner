import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { colors } from "../styles";
import { getUsers } from "../dataService";
import { useCurrentUser } from "../UserContext";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/profile", label: "User Profile" },
  { to: "/itineraries", label: "Itineraries" },
  { to: "/new-trip", label: "New Trip" },
  { to: "/ledger", label: "Ledger" },
];

export default function NavBar() {
  const [users, setUsers] = useState([]);
  const { currentUserId, setCurrentUserId } = useCurrentUser();

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        <span style={styles.brand}>TripSync</span>

        <div style={styles.links}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.linkActive : {}),
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* No real login yet -- this dropdown is a demo/testing
            stand-in until Person A's Cognito auth exists. */}
        <div style={styles.viewingAs}>
          <label style={styles.viewingAsLabel}>Viewing as</label>
          <select
            style={styles.select}
            value={currentUserId}
            onChange={(e) => setCurrentUserId(Number(e.target.value))}
          >
            {users.map((u) => (
              <option key={u.user_id} value={u.user_id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    borderBottom: `2px solid ${colors.accent}`,
    background: colors.ink,
  },
  inner: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
  },
  brand: {
    color: "white",
    fontWeight: 700,
    fontSize: "18px",
  },
  links: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  link: {
    color: "#D8DFDF",
    textDecoration: "none",
    fontSize: "14px",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  linkActive: {
    background: colors.accent,
    color: "white",
  },
  viewingAs: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  viewingAsLabel: {
    color: "#B9C2C2",
    fontSize: "12px",
  },
  select: {
    padding: "4px 8px",
    borderRadius: "6px",
    border: "none",
    fontSize: "13px",
  },
};
