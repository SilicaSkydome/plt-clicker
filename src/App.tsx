import React, { useEffect } from "react";
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
import { retrieveLaunchParams } from "@telegram-apps/sdk";

interface appContentProps {
  setBalance: (balance: number) => void;
  balance: number;
}
interface userData {
  id: string;
  firstName: string;
  username: string;
  lastInteraction: string;
  photoUrl: string;
}

// Компонент для обработки фона
const AppContent = ({ balance, setBalance }: appContentProps) => {
  const location = useLocation();
  const [user, setUser] = useState<userData | null>(null);

  const getBackgroundClass = () => {
    switch (location.pathname) {
      case "/":
        return "game-bg";
      default:
        return "default-bg";
    }
  };

  useEffect(() => {
    const app = (window as any).Telegram.WebApp;
    if (app) {
      app.ready();
      const user = app.initDataUnsafe.user;
      if (user) {
        const userData = {
          id: user.id.toString(),
          firstName: user.first_name,
          username: user.username || "",
          lastInteraction: new Date().toISOString(),
          photoUrl: user.photo_url || "",
        };
        setUser(userData);
        console.log("Пользователь из Mini App:", userData);

        // Отправляем данные пользователя на сервер
        // fetch("/saveUser", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify(userData),
        // })
        //   .then((response) => response.json())
        //   .then((result) => {
        //     console.log("Данные сохранены:", result);
        //   })
        //   .catch((err) => {
        //     console.error("Ошибка при сохранении:", err);
        //     setError("Не удалось сохранить данные");
        //   });
      } else {
        console.log("Пользователь не найден в Mini App");
      }
    } else {
      console.log("Telegram WebApp не доступен");
    }
  }, []);

  return (
    <div className={`app ${getBackgroundClass()}`}>
      <Header balance={balance} user={user} />
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
