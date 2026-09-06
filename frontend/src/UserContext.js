import React, { createContext, useContext, useState } from "react";

// ---------------------------------------------------------------
// UserContext
//
// No real login exists yet (that's Person A's Cognito work). Until
// then, this holds "who we're currently viewing the app as" in
// memory, defaulting to Alex (user_id 1), with a dropdown in the
// NavBar to switch between users for demo/testing purposes.
//
// Once real auth exists, replace the useState default below with
// whatever Cognito gives you as the logged-in user's ID, and you
// can remove the switcher dropdown from NavBar (or keep it as an
// admin/testing feature, your call).
// ---------------------------------------------------------------

const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUserId, setCurrentUserId] = useState(1); // default: Alex

  return (
    <UserContext.Provider value={{ currentUserId, setCurrentUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser() {
  return useContext(UserContext);
}
