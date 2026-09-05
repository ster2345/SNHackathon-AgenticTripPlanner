import React, { useEffect, useState } from "react";
import { getUser, updateUser } from "../dataService";
import { useCurrentUser } from "../UserContext";
import { colors, card, sectionTitle, input, label, button } from "../styles";

export default function UserProfile() {
  const { currentUserId } = useCurrentUser();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getUser(currentUserId).then((u) => {
      setUser(u);
      setForm(u);
    });
  }, [currentUserId]);

  if (!form) return <p>Loading profile...</p>;

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const updated = await updateUser(user.user_id, form);
    setUser(updated);
    setSaved(true);
  };

  return (
    <div>
      <h2 style={sectionTitle}>User Profile</h2>

      <form onSubmit={handleSave} style={card}>
        <label style={label}>Name</label>
        <input style={input} value={form.name} onChange={handleChange("name")} />

        <label style={label}>Age</label>
        <input
          style={input}
          type="number"
          value={form.age}
          onChange={handleChange("age")}
        />

        <label style={label}>Email</label>
        <input style={input} value={form.email} onChange={handleChange("email")} />

        <label style={label}>Dietary needs</label>
        <input
          style={input}
          value={form.dietary_needs}
          onChange={handleChange("dietary_needs")}
          placeholder="e.g. Vegetarian, Gluten-free, None"
        />

        <label style={label}>Blacklisted activities</label>
        <input
          style={input}
          value={form.blacklist_activities}
          onChange={handleChange("blacklist_activities")}
          placeholder="e.g. Bungee jumping, None"
        />

        <label style={label}>Blacklisted foods</label>
        <input
          style={input}
          value={form.blacklist_food}
          onChange={handleChange("blacklist_food")}
          placeholder="e.g. Seafood, None"
        />

        <button type="submit" style={{ ...button.base, ...button.primary }}>
          Save changes
        </button>
        {saved && <span style={styles.savedNote}>Saved.</span>}
      </form>
    </div>
  );
}

const styles = {
  savedNote: {
    marginLeft: "12px",
    color: colors.good,
    fontSize: "14px",
  },
};
