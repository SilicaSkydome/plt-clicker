import React, { useEffect, useState } from "react";
import "./App.css";
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
import Header from "./components/Header/Header";
import NavMenu from "./components/NavMenu/NavMenu";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

const AppContent = ({ balance, setBalance }: appContentProps) => {
  const location = useLocation();
  const [user, setUser] = useState<userData>({
    id: "",
    firstName: "",
    username: "",
    lastInteraction: "",
    photoUrl: "",
  });

  const getBackgroundClass = () => {
    switch (location.pathname) {
      case "/":
        return "game-bg";
      default:
        return "default-bg";
    }
  };

  // Инициализация данных пользователя
  useEffect(() => {
    const app = (window as any).Telegram.WebApp;
    if (app) {
      app.ready();
      const telegramUser = app.initDataUnsafe.user;

      const userData = {
        id: telegramUser.id.toString(),
        firstName: telegramUser.first_name,
        username: telegramUser.username || "",
        lastInteraction: new Date().toISOString(),
        photoUrl: telegramUser.photo_url || "",
      };
      setUser(userData);
      getUserBalance(userData);
    } else {
      console.log("Telegram WebApp не доступен");
    }
  }, []);

  // Логирование данных после их обновления
  useEffect(() => {
    if (user.id) {
      console.log("Пользователь из Mini App (обновлённое состояние):", user);
    }
  }, [user]);

  // Получение баланса из Firestore
  const getUserBalance = async (userData: userData) => {
    const userDocRef = doc(db, "userData", userData.id);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userDataFromDb = userDoc.data();
      setBalance(userDataFromDb.balance);
    } else {
      console.log(
        "Пользователь не найден в Firestore, создаем нового пользователя"
      );
      const newUser = {
        id: userData.id,
        firstName: userData.firstName,
        username: userData.username,
        lastInteraction: new Date().toISOString(),
        photoUrl: userData.photoUrl,
        balance: 0,
      };

      try {
        await setDoc(userDocRef, newUser);
        console.log("Новый пользователь создан в Firestore");
        setBalance(0);
      } catch (error) {
        console.error("Ошибка при создании нового пользователя:", error);
      }
    }
  };

  // Обновление данных пользователя в Firestore через интервал
  useEffect(() => {
    if (!user.id) return; // Если пользователь ещё не инициализирован, ничего не делаем

    const intervalId = setInterval(async () => {
      const userData = {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        lastInteraction: new Date().toISOString(),
        photoUrl: user.photoUrl,
        balance: balance,
      };
      console.log("Обновление данных пользователя:", userData);

      const userDocRef = doc(db, "userData", user.id);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          await setDoc(userDocRef, userData, { merge: true });
          console.log("Данные пользователя обновлены в Firestore");
        } else {
          console.log("Пользователь не найден в Firestore");
        }
      } catch (error) {
        console.error("Ошибка при обновлении данных пользователя:", error);
      }
    }, 10000);

    // Очистка интервала при размонтировании компонента
    return () => clearInterval(intervalId);
  }, [user, balance]); // Зависимости: user и balance

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
