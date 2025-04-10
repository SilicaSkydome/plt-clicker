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
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Task, UserData, Referal } from "./Interfaces";

// Определяем тип для window.env
declare global {
  interface Window {
    env?: {
      VITE_TEST_MODE: string;
    };
  }
}

interface AppContentProps {
  user: UserData;
  isLoading: boolean;
  balance: number;
  setBalance: (balance: number) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

const AppContent = ({
  user,
  isLoading,
  balance,
  setBalance,
  tasks,
  setTasks,
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
        <Route path="/invite" element={<Invite user={user} />} />
        <Route
          path="/earn"
          element={
            <Earn
              user={user}
              balance={balance}
              setBalance={setBalance}
              tasks={tasks}
              setTasks={setTasks}
            />
          }
        />
      </Routes>
      <NavMenu />
    </div>
  );
};

function App() {
  const [user, setUser] = useState<UserData>({
    id: "",
    firstName: "",
    username: "",
    lastInteraction: "",
    photoUrl: "",
    balance: 0,
    tasks: [],
    referals: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Проверяем, включен ли тестовый режим через window.env
        const isTestMode = window.env?.VITE_TEST_MODE === "true";

        let userData: UserData;
        let isTestUser = false;

        if (isTestMode) {
          console.warn(
            "Тестовый режим включен, используется тестовый пользователь"
          );
          userData = {
            id: "test_user_123",
            firstName: "Test",
            username: "testuser",
            lastInteraction: new Date().toISOString(),
            photoUrl: "https://placehold.co/40",
            balance: 1000,
            tasks: [],
            referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
          };
          isTestUser = true;
        } else {
          // Проверяем, доступен ли Telegram Web App
          const app = (window as any).Telegram?.WebApp;

          if (!app) {
            console.warn(
              "Telegram Web App недоступен, переключаемся на тестового пользователя"
            );
            // Используем тестового пользователя, если Telegram недоступен
            userData = {
              id: "test_user_123",
              firstName: "Test",
              username: "testuser",
              lastInteraction: new Date().toISOString(),
              photoUrl: "",
              balance: 1000,
              tasks: [],
              referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
            };
            isTestUser = true;
          } else {
            // Ждем, пока Telegram Web App будет готов
            app.ready();

            // Добавляем небольшую задержку, чтобы убедиться, что Telegram полностью инициализирован
            await new Promise((resolve) => setTimeout(resolve, 100));

            const telegramUser = app.initDataUnsafe?.user;

            if (!telegramUser) {
              console.warn(
                "Данные пользователя Telegram недоступны, переключаемся на тестового пользователя"
              );
              userData = {
                id: "test_user_123",
                firstName: "Test",
                username: "testuser",
                lastInteraction: new Date().toISOString(),
                photoUrl: "https://placehold.co/40",
                balance: 1000,
                tasks: [],
                referals: [
                  { id: "test_referral_1" },
                  { id: "test_referral_2" },
                ],
              };
              isTestUser = true;
            } else {
              userData = {
                id: telegramUser.id.toString(),
                firstName: telegramUser.first_name || "Unknown",
                username: telegramUser.username || "",
                lastInteraction: new Date().toISOString(),
                photoUrl: telegramUser.photo_url || "",
                balance: 0,
                tasks: [],
                referals: [],
              };
            }
          }
        }

        setUser(userData);

        // Получаем данные пользователя из Firestore (только если не тестовый пользователь)
        if (!isTestUser) {
          await getUserData(userData);

          // Проверка реферальной ссылки
          const app = (window as any).Telegram?.WebApp;
          const startParam = app?.initDataUnsafe?.start_param;
          if (startParam?.startsWith("ref_")) {
            const referrerId = startParam.split("_")[1];
            await handleReferral(userData.id, referrerId);
          }
        } else {
          // Для тестового пользователя устанавливаем начальные значения
          setBalance(userData.balance);
          setTasks(
            userData.tasks.map((task) => ({ ...task, action: () => false }))
          );
        }
      } catch (error) {
        console.error("Ошибка при инициализации пользователя:", error);
        // В случае любой ошибки переключаемся на тестового пользователя
        const fallbackUser: UserData = {
          id: "test_user_123",
          firstName: "Test",
          username: "testuser",
          lastInteraction: new Date().toISOString(),
          photoUrl: "",
          balance: 1000,
          tasks: [],
          referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
        };
        setUser(fallbackUser);
        setBalance(fallbackUser.balance);
        setTasks(
          fallbackUser.tasks.map((task) => ({ ...task, action: () => false }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const getUserData = async (userData: UserData) => {
    try {
      const userDocRef = doc(db, "userData", userData.id);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userDataFromDb = userDoc.data() as UserData;
        console.log("Данные пользователя из Firestore:", userDataFromDb);
        setBalance(userDataFromDb.balance || 0);
        setUser((prev) => ({
          ...prev,
          tasks: userDataFromDb.tasks || [],
          referals: userDataFromDb.referals || [],
        }));
        setTasks([]); // Сбрасываем tasks для синхронизации в Earn.tsx
      } else {
        console.log("Создаем нового пользователя в Firestore");
        const newUser: UserData = {
          id: userData.id,
          firstName: userData.firstName,
          username: userData.username,
          lastInteraction: new Date().toISOString(),
          photoUrl: userData.photoUrl,
          balance: 0,
          tasks: [],
          referals: [],
        };
        await setDoc(userDocRef, newUser);
        setBalance(0);
        setTasks([]);
      }
    } catch (error) {
      console.error("Ошибка при получении данных из Firestore:", error);
      setBalance(0);
      setTasks([]);
    }
  };

  const handleReferral = async (newUserId: string, referrerId: string) => {
    if (newUserId === referrerId) return; // Нельзя быть своим рефералом

    const referrerRef = doc(db, "userData", referrerId);
    const referrerSnap = await getDoc(referrerRef);

    if (referrerSnap.exists()) {
      const referrerData = referrerSnap.data() as UserData;
      const existingReferrals = referrerData.referals || [];

      // Проверяем, не добавлен ли уже этот реферал
      if (!existingReferrals.some((ref) => ref.id === newUserId)) {
        const newReferral: Referal = { id: newUserId };
        await updateDoc(referrerRef, {
          referals: arrayUnion(newReferral),
        });
        console.log(
          `Реферал ${newUserId} добавлен к пользователю ${referrerId}`
        );

        // Обновляем локальное состояние, избегая дублирования
        if (user.id === referrerId) {
          setUser((prev) => {
            const currentReferals = prev.referals || [];
            if (currentReferals.some((ref) => ref.id === newUserId)) {
              return prev; // Если реферал уже есть в локальном состоянии, не добавляем
            }
            return {
              ...prev,
              referals: [...currentReferals, newReferral],
            };
          });
        }
      } else {
        console.log(
          `Реферал ${newUserId} уже существует у пользователя ${referrerId}`
        );
      }
    } else {
      console.log(`Пользователь с ID ${referrerId} не найден в Firestore`);
    }
  };

  useEffect(() => {
    if (!user.id) return;

    // Пропускаем синхронизацию с Firestore для тестового пользователя
    if (user.id === "test_user_123") {
      console.log("Тестовый пользователь, синхронизация с Firestore отключена");
      return;
    }

    const intervalId = setInterval(async () => {
      const tasksToSave = tasks.map(({ action, ...rest }) => rest);
      const userData: UserData = {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        lastInteraction: new Date().toISOString(),
        photoUrl: user.photoUrl,
        balance: balance,
        tasks: tasksToSave,
        referals: user.referals || [],
      };

      const userDocRef = doc(db, "userData", user.id);
      try {
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          await setDoc(userDocRef, userData, { merge: true });
          console.log("Данные пользователя обновлены в Firestore");
          setUser((prev) => ({ ...prev, tasks: tasksToSave }));
        }
      } catch (error) {
        console.error("Ошибка при обновлении данных пользователя:", error);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user, balance, tasks]);

  return (
    <Router>
      <AppContent
        user={user}
        isLoading={isLoading}
        balance={balance}
        setBalance={setBalance}
        tasks={tasks}
        setTasks={setTasks}
      />
    </Router>
  );
}

export default App;
