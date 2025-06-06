import React, { useEffect, useState, useRef } from "react";
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
import NavMenu from "./components/NavMenu/NavMenu";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Task, TaskData, UserData, Referal, Rank } from "./Interfaces";
import useSession from "./api/UseSession"; // Путь к файлу useSession.ts
import SessionBlocked from "./components/Common/SessionBlocked/SessionBlocked"; // Путь к файлу SessionBlocked.tsx
import Store from "./pages/Store/Store";
import RoadMap from "./pages/Map/Map";

// Определяем тип для window.env
declare global {
  interface Window {
    env?: {
      VITE_TEST_MODE: string;
    };
  }
}

// Определяем ранги
const RANKS: Rank[] = [
  {
    title: "Cabin Boy",
    pirateTitle: "Cabin Boy",
    goldMin: 0,
    goldMax: 999,
    clickBonus: 0,
    goldPerClick: 0.035,
    level: 1,
    estimatedDays: 0,
  },
  {
    title: "Sailor",
    pirateTitle: "Sailor Saltbeard",
    goldMin: 1000,
    goldMax: 4999,
    clickBonus: 0.03,
    goldPerClick: 0.065,
    level: 1,
    estimatedDays: 3.3,
  },
  {
    title: "Quartermaster",
    pirateTitle: "Quartermaster Hookhand",
    goldMin: 5000,
    goldMax: 9999,
    clickBonus: 0.06,
    goldPerClick: 0.095,
    level: 3,
    estimatedDays: 10.4,
  },
  {
    title: "First Mate",
    pirateTitle: "First Mate Deadeye",
    goldMin: 10000,
    goldMax: 29999,
    clickBonus: 0.09,
    goldPerClick: 0.125,
    level: 5,
    estimatedDays: 15.9,
  },
  {
    title: "Captain",
    pirateTitle: "Captain Blackbeard",
    goldMin: 30000,
    goldMax: null,
    clickBonus: 0.12,
    goldPerClick: 0.195,
    level: 15,
    estimatedDays: 31.9,
  },
];

// Определяем начальный список задач
const initialTasks: Task[] = [
  {
    icon: "./assets/Quest1.png",
    title: "Subscribe to Telegram",
    description: "+50 PLGold",
    button: "",
    points: 50,
    completed: false,
    action: (balance: number, setBalance: (value: number) => void) => {
      //@ts-ignore
      if (window.Telegram?.WebApp) {
        //@ts-ignore
        window.Telegram.WebApp.openLink("https://t.me/PirateLife1721");
      } else {
        window.open("https://t.me/PirateLife1721", "_blank");
      }
      return true;
    },
  },
  {
    icon: "./assets/Quest2.png",
    title: "Invite 5 friends",
    description: "+250 PLGold",
    button: "",
    points: 250,
    completed: false,
    action: (
      balance: number,
      setBalance: (value: number) => void,
      user: UserData | null,
      navigate: (path: string) => void
    ) => {
      if (user) {
        if (user.referals && user.referals?.length < 5) {
          navigate("/invite");
          return false;
        } else if (user.referals && user.referals?.length >= 5) {
          return true;
        } else {
          navigate("/invite");
          return false;
        }
      }
      return false;
    },
  },
  {
    icon: "./assets/Quest3.png",
    title: "Join instagram",
    description: "+50 PLGold",
    button: "",
    points: 50,
    completed: false,
    action: (balance: number, setBalance: (value: number) => void) => {
      window.open("https://www.instagram.com/piratelife_official/", "_blank");
      return true;
    },
  },
];

// Функция для определения текущего ранга на основе баланса
const determineRank = (gold: number): Rank => {
  for (const rank of RANKS) {
    if (rank.goldMax === null) {
      if (gold >= rank.goldMin) return rank;
    } else if (gold >= rank.goldMin && gold <= rank.goldMax) {
      return rank;
    }
  }
  return RANKS[0];
};

// Функция для определения времени суток
const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6; // Ночь с 18:00 до 6:00
};

const testUser: UserData = {
  id: "test_user_123",
  firstName: "Test",
  username: "testuser",
  lastInteraction: new Date().toISOString(),
  photoUrl: "https://placehold.co/40",
  balance: 990,
  tasks: [],
  referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
  rank: determineRank(990),
  energy: 50,
  lastEnergyUpdate: Date.now(),
  selectedShip: "ship1", // Устанавливаем корабль по умолчанию
};

interface AppContentProps {
  user: UserData;
  isLoading: boolean;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  currentRank: Rank;
  initialEnergy: number;
  initialLastEnergyUpdate: number;
  saveEnergy: (newEnergy: number, updateTime: number) => Promise<void>;
  maxEnergy: number;
  setUser: React.Dispatch<React.SetStateAction<UserData>>;
}

const AppContent = ({
  user,
  isLoading,
  balance,
  setBalance,
  tasks,
  setTasks,
  currentRank,
  initialEnergy,
  initialLastEnergyUpdate,
  saveEnergy,
  maxEnergy,
  setUser,
}: AppContentProps) => {
  const location = useLocation();
  const [isNight, setIsNight] = useState(isNightTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsNight(isNightTime());
    }, 60000); // Проверяем каждую минуту
    return () => clearInterval(interval);
  }, []);

  const getBackgroundClass = () => {
    switch (location.pathname) {
      case "/":
        return isNight ? "game-bg-night" : "game-bg";
      default:
        return isNight ? "default-bg-night" : "default-bg";
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`app ${getBackgroundClass()}`}>
      <Routes>
        <Route
          path="/"
          element={
            <Game
              balance={balance}
              setBalance={setBalance}
              user={user}
              currentRank={currentRank}
              ranks={RANKS}
              initialEnergy={initialEnergy}
              initialLastEnergyUpdate={initialLastEnergyUpdate}
              saveEnergy={saveEnergy}
              maxEnergy={maxEnergy}
              setUser={setUser}
            />
          }
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
        <Route
          path="/store"
          element={
            <Store user={user} setUser={setUser} telegramUserId={user.id} />
          }
        />
        <Route path="/map" element={<RoadMap />} />
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
    rank: RANKS[0],
    energy: 50,
    lastEnergyUpdate: Date.now(),
    selectedShip: "ship1", // Устанавливаем корабль по умолчанию
  });
  const { isSessionBlocked } = useSession(user.id); // Добавляем хук
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalanceState] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentRank, setCurrentRank] = useState<Rank>(RANKS[0]);
  const [initialEnergy, setInitialEnergy] = useState<number>(50);
  const [initialLastEnergyUpdate, setInitialLastEnergyUpdate] =
    useState<number>(Date.now());
  const maxEnergy = 50;

  const prevDataRef = useRef({
    balance: 0,
    tasks: [] as Task[],
    currentRank: RANKS[0],
  });

  const setBalance: React.Dispatch<React.SetStateAction<number>> = (
    value: number | ((prev: number) => number)
  ) => {
    const newBalance = typeof value === "function" ? value(balance) : value;
    if (balance !== newBalance) {
      console.log("Обновление баланса:", { oldBalance: balance, newBalance });
      setBalanceState(newBalance);
    }
  };

  const mapTasksFromFirestore = (firestoreTasks: TaskData[]): Task[] => {
    return initialTasks.map((initialTask) => {
      const firestoreTask = firestoreTasks.find(
        (task) => task.title === initialTask.title
      );
      return firestoreTask
        ? { ...initialTask, completed: firestoreTask.completed }
        : initialTask;
    });
  };

  const saveEnergy = async (newEnergy: number, updateTime: number) => {
    if (!user.id || user.id === "test_user_123") {
      console.log("Тестовый пользователь, сохранение энергии отключено");
      return;
    }

    try {
      const userDocRef = doc(db, "userData", user.id);
      await setDoc(
        userDocRef,
        { energy: newEnergy, lastEnergyUpdate: updateTime },
        { merge: true }
      );
      console.log(`Энергия сохранена: ${newEnergy}, время: ${updateTime}`);
    } catch (error) {
      console.error("Ошибка при сохранении энергии:", error);
    }
  };

  useEffect(() => {
    const newRank = determineRank(balance);
    if (JSON.stringify(newRank) !== JSON.stringify(currentRank)) {
      setCurrentRank(newRank);
      setUser((prev) => ({ ...prev, rank: newRank }));
    }
  }, [balance]);

  useEffect(() => {
    console.log("Инициализация пользователя", user);
    const initializeUser = async () => {
      try {
        const isTestMode = window.env?.VITE_TEST_MODE === "true";
        let userData: UserData;
        let isTestUser = false;

        if (isTestMode) {
          userData = {
            id: "test_user_123",
            firstName: "Test",
            username: "testuser",
            lastInteraction: new Date().toISOString(),
            photoUrl: "https://placehold.co/40",
            balance: 1000,
            tasks: [],
            referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
            rank: determineRank(1000),
            energy: 50,
            lastEnergyUpdate: Date.now(),
          };
          isTestUser = true;
        } else {
          const app = (window as any).Telegram?.WebApp;
          if (!app) {
            userData = testUser;
            isTestUser = true;
          } else {
            app.ready();
            await new Promise((resolve) => setTimeout(resolve, 100));
            const telegramUser = app.initDataUnsafe?.user;
            if (!telegramUser) {
              userData = testUser;
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
                rank: RANKS[0],
                energy: 50,
                lastEnergyUpdate: Date.now(),
              };
            }
          }
        }

        setUser(userData);
        console.log("Пользователь установлен", userData);

        if (!isTestUser) {
          await getUserData(userData);
        } else {
          setBalance(userData.balance);
          setInitialEnergy(userData.energy);
          setInitialLastEnergyUpdate(userData.lastEnergyUpdate);
          setCurrentRank(userData.rank || RANKS[0]);
          setTasks(
            userData.tasks.map((task) => ({ ...task, action: () => false }))
          );
        }
      } catch (error) {
        console.error("Ошибка при инициализации пользователя:", error);
        const fallbackUser: UserData = testUser;
        setUser(fallbackUser);
        setBalance(fallbackUser.balance);
        setInitialEnergy(fallbackUser.energy);
        setInitialLastEnergyUpdate(fallbackUser.lastEnergyUpdate);
        setCurrentRank(fallbackUser.rank || RANKS[0]);
        setTasks(
          fallbackUser.tasks.map((task) => ({ ...task, action: () => false }))
        );
      } finally {
        setIsLoading(false);
        console.log("Завершение инициализации, isLoading:", isLoading);
      }
    };
    initializeUser();
  }, []); // Убрали зависимость user

  useEffect(() => {
    const app = (window as any).Telegram?.WebApp;

    if (app) {
      const handleStartParam = async () => {
        const startParam = app.initDataUnsafe?.start_param;
        if (startParam?.startsWith("ref_")) {
          const referrerId = startParam.split("_")[1];
          await handleReferral(user.id, referrerId);

          app.sendData(
            JSON.stringify({
              type: "sendMessage",
              chat_id: user.id,
              text: `Welcome! You were referred by user ${referrerId}.`,
            })
          );
        } else {
          app.sendData(
            JSON.stringify({
              type: "sendMessage",
              chat_id: user.id,
              text: "Welcome to the game! Click on the boat to start earning gold.",
            })
          );
        }
      };

      handleStartParam();

      app.onEvent("initData", handleStartParam);

      return () => {
        app.offEvent("initData", handleStartParam);
      };
    }
  }, [user.id]);

  const getUserData = async (userData: UserData) => {
    try {
      const userDocRef = doc(db, "userData", userData.id);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userDataFromDb = userDoc.data() as UserData;
        setBalance(userDataFromDb.balance || 0);

        const storedEnergy = userDataFromDb.energy ?? 50;
        const storedLastUpdate = userDataFromDb.lastEnergyUpdate ?? Date.now();
        const currentTime = Date.now();
        const timeElapsed = (currentTime - storedLastUpdate) / 1000;
        const energyToAdd = Math.floor(timeElapsed / 30);
        const newEnergy = Math.min(storedEnergy + energyToAdd, maxEnergy);

        setInitialEnergy(newEnergy);
        setInitialLastEnergyUpdate(currentTime);
        await setDoc(
          userDocRef,
          { energy: newEnergy, lastEnergyUpdate: currentTime },
          { merge: true }
        );

        setCurrentRank(userDataFromDb.rank || RANKS[0]);
        setUser((prev) => ({
          ...prev,
          tasks: userDataFromDb.tasks || [],
          referals: userDataFromDb.referals || [],
          rank: userDataFromDb.rank || RANKS[0],
          energy: newEnergy,
          lastEnergyUpdate: currentTime,
        }));
        const mappedTasks = mapTasksFromFirestore(userDataFromDb.tasks || []);
        setTasks(mappedTasks);
      } else {
        const newUser: UserData = {
          id: userData.id,
          firstName: userData.firstName,
          username: userData.username,
          lastInteraction: new Date().toISOString(),
          photoUrl: userData.photoUrl,
          balance: 0,
          tasks: [],
          referals: [],
          rank: RANKS[0],
          energy: 50,
          lastEnergyUpdate: Date.now(),
        };
        await setDoc(userDocRef, newUser);
        setBalance(0);
        setInitialEnergy(50);
        setInitialLastEnergyUpdate(Date.now());
        setCurrentRank(RANKS[0]);
        setTasks(initialTasks);
      }
    } catch (error) {
      console.error("Ошибка при получении данных из Firestore:", error);
      setBalance(0);
      setInitialEnergy(50);
      setInitialLastEnergyUpdate(Date.now());
      setCurrentRank(RANKS[0]);
      setTasks(initialTasks);
    }
  };

  const handleReferral = async (newUserId: string, referrerId: string) => {
    if (newUserId === referrerId) {
      return;
    }

    try {
      const referrerRef = doc(db, "userData", referrerId);
      const referrerSnap = await getDoc(referrerRef);

      if (referrerSnap.exists()) {
        const referrerData = referrerSnap.data() as UserData;
        const existingReferrals = referrerData.referals || [];

        if (!existingReferrals.some((ref) => ref.id === newUserId)) {
          const newReferral: Referal = { id: newUserId };
          await updateDoc(referrerRef, {
            referals: arrayUnion(newReferral),
            balance: (referrerData.balance || 0) + 100,
          });

          if (user.id === referrerId) {
            setUser((prev) => {
              const updatedReferals = [...(prev.referals || []), newReferral];
              localStorage.setItem(
                `referrals_${user.id}`,
                JSON.stringify(updatedReferals)
              );
              return {
                ...prev,
                referals: updatedReferals,
                balance: (prev.balance || 0) + 100,
              };
            });
            setBalance((prev) => prev + 100);
          }
        }
      } else {
        const newReferrer: UserData = {
          id: referrerId,
          firstName: "Unknown",
          username: "",
          lastInteraction: new Date().toISOString(),
          photoUrl: "",
          balance: 100,
          tasks: [],
          referals: [{ id: newUserId }],
          rank: RANKS[0],
          energy: 50,
          lastEnergyUpdate: Date.now(),
        };
        await setDoc(referrerRef, newReferrer);
      }
    } catch (error) {
      console.error("Ошибка при обработке реферала:", error);
    }
  };

  useEffect(() => {
    if (!user.id || user.id === "test_user_123") {
      return;
    }

    const hasDataChanged = () => {
      const currentData = {
        balance: Number(balance.toFixed(2)),
        tasks,
        currentRank,
      };
      const prevData = {
        balance: Number(prevDataRef.current.balance.toFixed(2)),
        tasks: prevDataRef.current.tasks,
        currentRank: prevDataRef.current.currentRank,
      };

      const balanceChanged = currentData.balance !== prevData.balance;
      const tasksChanged =
        JSON.stringify(currentData.tasks) !== JSON.stringify(prevData.tasks);
      const rankChanged =
        JSON.stringify(currentData.currentRank) !==
        JSON.stringify(prevData.currentRank);

      return balanceChanged || tasksChanged || rankChanged;
    };

    const syncWithFirestore = async () => {
      if (balance < 0) {
        return;
      }

      const tasksToSave = tasks.map(({ action, ...rest }) => rest);
      const userData: Partial<UserData> = {
        id: user.id,
        firstName: user.firstName,
        username: user.username,
        lastInteraction: new Date().toISOString(),
        photoUrl: user.photoUrl,
        balance: balance,
        tasks: tasksToSave,
        referals: user.referals || [],
        rank: currentRank,
      };

      const userDocRef = doc(db, "userData", user.id);
      try {
        await setDoc(userDocRef, userData, { merge: true });
      } catch (error) {
        console.error("Ошибка при обновлении данных пользователя:", error);
      }
    };

    if (hasDataChanged()) {
      syncWithFirestore();
    }

    prevDataRef.current = { balance, tasks, currentRank };
  }, [balance, tasks, currentRank]);

  return (
    <>
      {isSessionBlocked ? (
        <SessionBlocked />
      ) : (
        <Router>
          <AppContent
            user={user}
            isLoading={isLoading}
            balance={balance}
            setBalance={setBalance}
            tasks={tasks}
            setTasks={setTasks}
            currentRank={currentRank}
            initialEnergy={initialEnergy}
            initialLastEnergyUpdate={initialLastEnergyUpdate}
            saveEnergy={saveEnergy}
            maxEnergy={maxEnergy}
            setUser={setUser}
          />
        </Router>
      )}
    </>
  );
}

export default App;
