// App.tsx
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

interface userData {
  id: string;
  firstName: string;
  username: string;
  lastInteraction: string;
  photoUrl: string;
}

interface AppContentProps {
  user: userData;
  isLoading: boolean;
  balance: number;
  setBalance: (balance: number) => void;
}

const AppContent = ({
  user,
  isLoading,
  balance,
  setBalance,
}: AppContentProps) => {
  const location = useLocation();

  const getBackgroundClass = () => {
    switch (location.pathname) {
      case "/":
        return "game-bg";
      default:
        return "default-bg";
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div className={`app ${getBackgroundClass()}`}>
      <Header balance={balance} user={user} />
      <Routes>
        <Route
          path="/"
          element={<Game balance={balance} setBalance={setBalance} />}
        />
        <Route path="/stats" element={<Stats />} />
        <Route path="/invite" element={<Invite />} />
        <Route path="/earn" element={<Earn />} />
      </Routes>
      <NavMenu />
    </div>
  );
};

function App() {
  const [user, setUser] = useState<userData>({
    id: "",
    firstName: "",
    username: "",
    lastInteraction: "",
    photoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0); // Устанавливаем начальное значение 0

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const app = (window as any).Telegram.WebApp;
        if (app) {
          app.ready();
          const telegramUser = app.initDataUnsafe.user;

          if (!telegramUser) {
            console.error("Telegram user data is not available");
            setBalance(0);
            setIsLoading(false);
            return;
          }

          const userData = {
            id: telegramUser.id.toString(),
            firstName: telegramUser.first_name,
            username: telegramUser.username || "",
            lastInteraction: new Date().toISOString(),
            photoUrl: telegramUser.photo_url || "",
          };
          console.log("Инициализация пользователя:", userData);
          setUser(userData);
          await getUserBalance(userData);
        } else {
          console.error("Telegram WebApp не доступен");
          setBalance(0);
        }
      } catch (error) {
        console.error("Ошибка при инициализации пользователя:", error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (user.id) {
      console.log("Пользователь из Mini App (обновлённое состояние):", user);
    }
  }, [user]);

  const getUserBalance = async (userData: userData) => {
    try {
      const userDocRef = doc(db, "userData", userData.id);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userDataFromDb = userDoc.data();
        console.log("Данные пользователя из Firestore:", userDataFromDb);
        setBalance(userDataFromDb.balance || 0); // Устанавливаем 0, если balance отсутствует
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

        await setDoc(userDocRef, newUser);
        console.log("Новый пользователь создан в Firestore");
        setBalance(0);
      }
    } catch (error) {
      console.error("Ошибка при получении баланса из Firestore:", error);
      setBalance(0);
    }
  };

  useEffect(() => {
    if (!user.id) return;

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
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user, balance]);

  return (
    <Router>
      <AppContent
        user={user}
        isLoading={isLoading}
        balance={balance}
        setBalance={setBalance}
      />
    </Router>
  );
}

export default App;
