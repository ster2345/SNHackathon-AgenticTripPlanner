import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import UserProfile from "./pages/UserProfile";
import Itineraries from "./pages/Itineraries";
import TripDetail from "./pages/TripDetail";
import NewTrip from "./pages/NewTrip";
import Ledger from "./pages/Ledger";
import { page } from "./styles";
import { UserProvider } from "./UserContext";

function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <NavBar />
        <div style={page}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<UserProfile />} />
            <Route path="/itineraries" element={<Itineraries />} />
            <Route path="/itineraries/:groupId" element={<TripDetail />} />
            <Route path="/new-trip" element={<NewTrip />} />
            <Route path="/ledger" element={<Ledger />} />
          </Routes>
        </div>
      </BrowserRouter>
    </UserProvider>
  );
}

export default App;
