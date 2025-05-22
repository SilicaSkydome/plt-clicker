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
import Header from "./components/Header/Header";
import NavMenu from "./components/NavMenu/NavMenu";
import { db } from "../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Task, TaskData, UserData, Referal, Rank } from "./Interfaces";

// Определяем тип для window.env
declare global {
  interface Window {
    env?: {
      VITE_TEST_MODE: string;
    };
  }
}

// Определяем ранги на основе таблицы*
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
  });
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

  // Функция для сохранения энергии и времени обновления
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

  // Функция для проверки и управления сессией через Firestore
  const manageSession = async (userId: string) => {
    if (!userId || userId === "test_user_123") {
      console.log("Тестовый пользователь, управление сессией отключено");
      return true;
    }

    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 минут
    const userDocRef = doc(db, "userData", userId);
    const currentTime = Date.now();

    try {
      const userDoc = await getDoc(userDocRef);
      let activeSession = null;

      if (userDoc.exists()) {
        const userData = userDoc.data();
        activeSession = userData.activeSession;
        console.log("Получены данные сессии из Firestore:", activeSession);
      } else {
        console.log("Документ пользователя не существует, создаём новый");
        await setDoc(userDocRef, { activeSession: null }, { merge: true });
      }

      // Проверяем валидность сессии с учётом всех вкладок
      if (
        activeSession &&
        typeof activeSession === "object" &&
        activeSession.sessionId
      ) {
        const sessionAge = currentTime - activeSession.timestamp;
        console.log("Сессия найдена:", {
          sessionId: activeSession.sessionId,
          timestamp: activeSession.timestamp,
          sessionAge: sessionAge / 1000 / 60,
        });

        if (sessionAge < SESSION_TIMEOUT) {
          // Проверяем, активна ли сессия на других вкладках через localStorage
          const localSession = localStorage.getItem(`session_${userId}`);
          if (localSession && localSession !== activeSession.sessionId) {
            console.log("Сессия активна в другой вкладке, блокируем запуск");
            window.alert(
              "Game already opened in another window! Use /reset_session in the bot to reset."
            );
            return false;
          }
        } else {
          console.log("Сессия истекла, очищаем");
          await setDoc(userDocRef, { activeSession: null }, { merge: true });
        }
      }

      // Создаём новую сессию
      const newSessionId = `${userId}_${currentTime}`;
      const newSession = { sessionId: newSessionId, timestamp: currentTime };
      await setDoc(userDocRef, { activeSession: newSession }, { merge: true });
      localStorage.setItem(`session_${userId}`, newSessionId);
      console.log("Новая сессия создана:", newSession);

      // Запускаем heartbeat
      const heartbeatInterval = setInterval(async () => {
        try {
          const currentDoc = await getDoc(userDocRef);
          const currentSession = currentDoc.data()?.activeSession;
          if (
            currentSession &&
            currentSession.sessionId === newSessionId &&
            Date.now() - currentSession.timestamp < SESSION_TIMEOUT
          ) {
            await updateDoc(userDocRef, {
              "activeSession.timestamp": Date.now(),
            });
            console.log("Heartbeat: сессия обновлена", {
              sessionId: newSessionId,
              timestamp: Date.now(),
            });
          } else {
            clearInterval(heartbeatInterval);
            console.log("Heartbeat: сессия устарела, останавливаем");
          }
        } catch (error) {
          console.error("Ошибка в heartbeat:", error);
          clearInterval(heartbeatInterval);
        }
      }, 30 * 1000);

      // Очистка при закрытии окна
      const handleBeforeUnload = async () => {
        try {
          localStorage.removeItem(`session_${userId}`);
          await setDoc(userDocRef, { activeSession: null }, { merge: true });
          console.log("Сессия очищена при закрытии окна");
          clearInterval(heartbeatInterval);
        } catch (error) {
          console.error("Ошибка при очистке сессии:", error);
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);

      return true;
    } catch (error) {
      console.error("Ошибка при управлении сессией:", error);
      window.alert(
        "Error managing session. Please try again or use /reset_session in the bot."
      );
      return true; // Разрешаем запуск при ошибке
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
    const initializeUser = async () => {
      try {
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
            rank: determineRank(1000),
            energy: 50,
            lastEnergyUpdate: Date.now(),
          };
          isTestUser = true;
        } else {
          const app = (window as any).Telegram?.WebApp;

          if (!app) {
            console.warn(
              "Telegram Web App недоступен, переключаемся на тестового пользователя"
            );
            userData = testUser;
            isTestUser = true;
          } else {
            app.ready();
            await new Promise((resolve) => setTimeout(resolve, 100));

            const telegramUser = app.initDataUnsafe?.user;

            if (!telegramUser) {
              console.warn(
                "Данные пользователя Telegram недоступны, переключаемся на тестового пользователя"
              );
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

        console.log("Инициализированный пользователь:", userData);
        setUser(userData);

        // Проверяем сессию
        if (!isTestUser && userData.id) {
          const isSessionValid = await manageSession(userData.id);
          if (!isSessionValid) {
            return; // Прерываем инициализацию, если сессия невалидна
          }
        }

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
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    const app = (window as any).Telegram?.WebApp;

    if (app) {
      const handleStartParam = async () => {
        const startParam = app.initDataUnsafe?.start_param;
        console.log("Получен start_param:", startParam);
        if (startParam?.startsWith("ref_")) {
          const referrerId = startParam.split("_")[1];
          console.log(
            `Обрабатываем реферала: newUserId=${user.id}, referrerId=${referrerId}`
          );
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
        console.log("Данные пользователя из Firestore:", userDataFromDb);

        // Загружаем баланс
        setBalance(userDataFromDb.balance || 0);

        // Загружаем энергию и рассчитываем восстановление
        const storedEnergy = userDataFromDb.energy ?? 50;
        const storedLastUpdate = userDataFromDb.lastEnergyUpdate ?? Date.now();
        const currentTime = Date.now();
        const timeElapsed = (currentTime - storedLastUpdate) / 1000; // Время в секундах
        const energyToAdd = Math.floor(timeElapsed / 30); // 1 энергия каждые 30 секунд
        const newEnergy = Math.min(storedEnergy + energyToAdd, maxEnergy);

        setInitialEnergy(newEnergy);
        setInitialLastEnergyUpdate(currentTime);

        // Сохраняем обновлённую энергию и время
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
      console.log("Пользователь не может быть своим рефералом");
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
          console.log(
            `Реферал ${newUserId} успешно добавлен к пользователю ${referrerId}`
          );

          if (user.id === referrerId) {
            setUser((prev) => {
              const currentReferals = prev.referals || [];
              if (currentReferals.some((ref) => ref.id === newUserId)) {
                return prev;
              }
              const updatedReferals = [...currentReferals, newReferral];
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
        } else {
          console.log(
            `Реферал ${newUserId} уже существует у пользователя ${referrerId}`
          );
        }
      } else {
        console.log(`Пользователь с ID ${referrerId} не найден в Firestore`);
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
        console.log(
          `Создан новый пользователь с ID ${referrerId} с рефералом ${newUserId}`
        );
      }
    } catch (error) {
      console.error("Ошибка при обработке реферала:", error);
    }
  };

  // Эффект для синхронизации данных с Firestore
  useEffect(() => {
    if (!user.id || user.id === "test_user_123") {
      console.log("Тестовый пользователь, синхронизация с Firestore отключена");
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

      console.log("Проверка изменений данных:", {
        balanceChanged,
        tasksChanged,
        rankChanged,
        currentBalance: currentData.balance,
        prevBalance: prevData.balance,
        currentTasks: currentData.tasks.map((t) => t.title),
        prevTasks: prevData.tasks.map((t) => t.title),
        currentRank: currentData.currentRank.title,
        prevRank: prevData.currentRank.title,
      });

      return balanceChanged || tasksChanged || rankChanged;
    };

    const syncWithFirestore = async () => {
      console.log("Синхронизация с Firestore...");
      if (balance < 0) {
        console.warn(
          "Баланс не может быть отрицательным, пропускаем синхронизацию"
        );
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
        console.log(
          "Данные пользователя успешно обновлены в Firestore",
          userData
        );
      } catch (error) {
        console.error("Ошибка при обновлении данных пользователя:", error);
      }
    };

    if (hasDataChanged()) {
      console.log("Данные изменились, синхронизируем с Firestore");
      syncWithFirestore();
    }

    prevDataRef.current = { balance, tasks, currentRank };
  }, [balance, tasks, currentRank]);

  return (
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
      />
    </Router>
  );
}

export default App;
