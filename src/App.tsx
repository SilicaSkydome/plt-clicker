import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Game from "./pages/Game/Game";
import Stats from "./pages/Stats/Stats";
import Invite from "./pages/Invite/Invite";
import Earn from "./pages/Earn/Earn";
import "./App.css";
import Header from "./components/Header/Header";
import NavMenu from "./components/NavMenu/NavMenu";
import { useState } from "react";

function App() {
  const [balance, setBalance] = useState(0);

  return (
    <Router>
      <div className="app">
        <Header balance={balance} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Game setBalance={setBalance} />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/earn" element={<Earn />} />
          </Routes>
        </div>

        <NavMenu />
      </div>
    </Router>
  );
}

export default App;
