import { useState } from "react";

function JoinTrip() {
  const [inviteCode, setInviteCode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Backend connection will be added later
    console.log("Joining with code:", inviteCode);
  };

  return (
    <div>
      <h1>Join a Trip</h1>

      <form onSubmit={handleSubmit}>
        <label>Invite Code</label>

        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Enter invite code"
        />

        <button type="submit">Join Trip</button>
      </form>
    </div>
  );
}

export default JoinTrip;