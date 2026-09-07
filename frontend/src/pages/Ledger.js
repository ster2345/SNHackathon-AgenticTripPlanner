import React, { useEffect, useState } from "react";
import { getUserLedger, getUsers, settleUp } from "../dataService";
import { useCurrentUser } from "../UserContext";
import { colors, card, sectionTitle, button } from "../styles";

export default function Ledger() {
  const { currentUserId } = useCurrentUser();
  const [owesOthers, setOwesOthers] = useState({});
  const [owedByOthers, setOwedByOthers] = useState({});
  const [users, setUsers] = useState([]);

  const loadLedger = () => {
    getUserLedger(currentUserId).then(({ owesOthers, owedByOthers }) => {
      setOwesOthers(owesOthers);
      setOwedByOthers(owedByOthers);
    });
  };

  useEffect(() => {
    loadLedger();
    getUsers().then(setUsers);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  const getUserName = (id) => users.find((u) => u.user_id === id)?.name || `User ${id}`;

  const handleSettleUp = async (toId) => {
    await settleUp(currentUserId, toId);
    loadLedger();
  };

  const owesEntries = Object.entries(owesOthers);
  const owedEntries = Object.entries(owedByOthers);

  const totalOwed = owesEntries.reduce((sum, [, amt]) => sum + amt, 0);
  const totalOwedToYou = owedEntries.reduce((sum, [, amt]) => sum + amt, 0);

  return (
    <div>
      <h2 style={sectionTitle}>Your Ledger</h2>

      <div style={styles.totalsRow}>
        <div style={{ ...card, ...styles.totalCard }}>
          <div style={styles.totalLabel}>You owe</div>
          <div style={{ ...styles.totalAmount, color: colors.bad }}>
            ${totalOwed.toFixed(2)}
          </div>
        </div>
        <div style={{ ...card, ...styles.totalCard }}>
          <div style={styles.totalLabel}>Owed to you</div>
          <div style={{ ...styles.totalAmount, color: colors.good }}>
            ${totalOwedToYou.toFixed(2)}
          </div>
        </div>
      </div>

      <h3 style={{ ...sectionTitle, fontSize: "16px" }}>You owe</h3>
      <div style={card}>
        {owesEntries.length === 0 && <p style={styles.emptyText}>You're all settled up.</p>}
        {owesEntries.map(([toId, amount]) => (
          <div key={toId} style={styles.line}>
            <span>
              You owe <strong>{getUserName(Number(toId))}</strong>
            </span>
            <span style={styles.lineRight}>
              <span style={{ color: colors.bad, fontWeight: 700 }}>
                ${amount.toFixed(2)}
              </span>
              <button
                style={{ ...button.base, ...button.secondary, ...styles.settleButton }}
                onClick={() => handleSettleUp(Number(toId))}
              >
                Settle up
              </button>
            </span>
          </div>
        ))}
      </div>

      <h3 style={{ ...sectionTitle, fontSize: "16px" }}>Owed to you</h3>
      <div style={card}>
        {owedEntries.length === 0 && <p style={styles.emptyText}>Nobody owes you right now.</p>}
        {owedEntries.map(([fromId, amount]) => (
          <div key={fromId} style={styles.line}>
            <span>
              <strong>{getUserName(Number(fromId))}</strong> owes you
            </span>
            <span style={{ color: colors.good, fontWeight: 700 }}>
              ${amount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  totalsRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginBottom: "8px",
  },
  totalCard: {
    textAlign: "center",
  },
  totalLabel: {
    fontSize: "13px",
    color: colors.textMuted,
    marginBottom: "4px",
  },
  totalAmount: {
    fontSize: "26px",
    fontWeight: 700,
  },
  line: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: `1px solid ${colors.border}`,
    fontSize: "14px",
  },
  lineRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  settleButton: {
    padding: "4px 12px",
    fontSize: "12px",
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: "14px",
    margin: 0,
  },
};
