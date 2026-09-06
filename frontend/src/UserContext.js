import React, {
  createContext,
  useContext,
  useState,
} from "react";


const UserContext = createContext(null);


export function UserProvider({ children }) {
  const [currentUserId, setCurrentUserIdState] = useState(() => {
    const savedUserId = localStorage.getItem("currentUserId");

    return savedUserId
      ? Number(savedUserId)
      : 1;
  });


  function setCurrentUserId(userId) {
    setCurrentUserIdState(userId);

    localStorage.setItem(
      "currentUserId",
      String(userId)
    );
  }


  return (
    <UserContext.Provider
      value={{
        currentUserId,
        setCurrentUserId,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}


export function useCurrentUser() {
  return useContext(UserContext);
}