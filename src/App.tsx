import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Game from "./pages/Game/Game";
import Stats from "./pages/Stats/Stats";
import Invite from "./pages/Invite/Invite";
import Earn from "./pages/Earn/Earn";
import "./App.css";
import Header from "./components/Header/Header";
import NavMenu from "./components/NavMenu/NavMenu";
import { useState } from "react";

interface appContentProps {
  setBalance: (balance: number) => void;
  balance: number;
}

// Компонент для обработки фона
const AppContent = ({ balance, setBalance }: appContentProps) => {
  const location = useLocation();

  const getBackgroundClass = () => {
    switch (location.pathname) {
      case "/":
        return "game-bg";
      default:
        return "default-bg";
    }
  };

  return (
    <div className={`app ${getBackgroundClass()}`}>
      <Header balance={balance} />
      <Routes>
        <Route path="/" element={<Game setBalance={setBalance} />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/earn" element={<Earn />} />
      </Routes>
      <NavMenu />
    </div>
  );
};

function App() {
  const [balance, setBalance] = useState(0);

  return (
    <Router>
      <AppContent balance={balance} setBalance={setBalance} />
    </Router>
  );
}

export default App;
