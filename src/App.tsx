import React, { useEffect, useState, useRef } from "react";
import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { debounce } from "lodash";
import Game from "./pages/Game/Game";
import Stats from "./pages/Stats/Stats";
import Invite from "./pages/Invite/Invite";
import Earn from "./pages/Earn/Earn";
import Header from "./components/Header/Header";
import NavMenu from "./components/NavMenu/NavMenu";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import { Task, TaskData, UserData, Referal, Rank } from "./Interfaces";

// Определяем тип для window.env
declare global {
  interface Window {
    env?: {
      VITE_TEST_MODE: string;
    };
  }
}

// Определяем ранги на основе таблицы
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

// Определяем начальный список задач (переносим из Earn.tsx)
const initialTasks: Task[] = [
  {
    icon: "./assets/Quest1.png",
    title: "Subscribe to Telegram",
    description: "+50 PLGold",
    button: "",
    points: 50,
    completed: false,
    action: (balance, setBalance) => {
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
    action: (balance, setBalance, user, navigate) => {
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
    action: (balance, setBalance) => {
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

const testUser = {
  id: "test_user_123",
  firstName: "Test",
  username: "testuser",
  lastInteraction: new Date().toISOString(),
  photoUrl: "https://placehold.co/40",
  balance: 990,
  tasks: [],
  referals: [{ id: "test_referral_1" }, { id: "test_referral_2" }],
  rank: determineRank(990),
};

interface AppContentProps {
  user: UserData;
  isLoading: boolean;
  balance: number;
  setBalance: (balance: number) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  currentRank: Rank;
}

const AppContent = ({
  user,
  isLoading,
  balance,
  setBalance,
  tasks,
  setTasks,
  currentRank,
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
    return <div>Loading...</div>;
  }

  return (
    <div className={`app ${getBackgroundClass()}`}>
      <Header balance={balance} user={user} />
      <Routes>
        <Route
          path="/"
          element={
            <Game
              balance={balance}
              setBalance={setBalance}
              currentRank={currentRank}
              ranks={RANKS}
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [balance, setBalanceState] = useState<number>(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentRank, setCurrentRank] = useState<Rank>(RANKS[0]);

  // Храним предыдущие данные для сравнения
  const prevDataRef = useRef({
    balance: 0,
    tasks: [] as Task[],
    currentRank: RANKS[0],
  });
  // Храним таймер для задержки синхронизации
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Добавляем логирование для setBalance
  const setBalance = (newBalance: number) => {
    console.log("Обновление баланса:", { oldBalance: balance, newBalance });
    setBalanceState(newBalance);
  };

  // Функция для преобразования TaskData[] в Task[]
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

  useEffect(() => {
    const newRank = determineRank(balance);
    setCurrentRank(newRank);
    setUser((prev) => ({ ...prev, rank: newRank }));
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
              };
            }
          }
        }

        console.log("Инициализированный пользователь:", userData);
        setUser(userData);

        if (!isTestUser) {
          await getUserData(userData);
        } else {
          setBalance(userData.balance);
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

  // Эффект для обработки start_param и команды /start
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

  // Эффект для синхронизации с Firestore в реальном времени
  useEffect(() => {
    console.log("useEffect для синхронизации вызван (onSnapshot)", {
      userId: user.id,
      balance,
      tasks: tasks.map((t) => t.title),
      currentRank: currentRank.title,
    });
    // Проверяем, что user.id существует и не является тестовым пользователем
    if (!user.id || user.id === "test_user_123") return;

    console.log(
      "Подписываемся на обновления Firestore для пользователя:",
      user.id
    );

    // Загружаем рефералов из localStorage при старте
    const cachedReferrals = localStorage.getItem(`referrals_${user.id}`);
    if (cachedReferrals) {
      setUser((prev) => ({
        ...prev,
        referals: JSON.parse(cachedReferrals),
      }));
    }

    const userDocRef = doc(db, "userData", user.id);
    const debouncedUpdate = debounce((userDataFromDb: UserData) => {
      // Проверяем, изменились ли данные, чтобы избежать лишних обновлений
      if (balance !== (userDataFromDb.balance || 0)) {
        console.log("Обновляем balance из Firestore:", userDataFromDb.balance);
        setBalance(userDataFromDb.balance || 0);
      }

      const newRank = userDataFromDb.rank || RANKS[0];
      if (JSON.stringify(currentRank) !== JSON.stringify(newRank)) {
        console.log("Обновляем currentRank из Firestore:", newRank);
        setCurrentRank(newRank);
      }

      const mappedTasks = mapTasksFromFirestore(userDataFromDb.tasks || []);
      if (JSON.stringify(tasks) !== JSON.stringify(mappedTasks)) {
        console.log("Обновляем tasks из Firestore:", mappedTasks);
        setTasks(mappedTasks);
      }

      const updatedReferals = userDataFromDb.referals || [];
      if (JSON.stringify(user.referals) !== JSON.stringify(updatedReferals)) {
        console.log("Обновляем referals из Firestore:", updatedReferals);
        setUser((prev) => {
          localStorage.setItem(
            `referrals_${user.id}`,
            JSON.stringify(updatedReferals)
          );
          return {
            ...prev,
            tasks: userDataFromDb.tasks || [],
            referals: updatedReferals,
            rank: userDataFromDb.rank || RANKS[0],
          };
        });
      }
    }, 500);

    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const userDataFromDb = doc.data() as UserData;
          console.log(
            "Данные пользователя обновлены из Firestore:",
            userDataFromDb
          );
          console.log("Обновленный массив рефералов:", userDataFromDb.referals);
          debouncedUpdate(userDataFromDb);
        } else {
          console.log("Документ пользователя не существует в Firestore");
        }
      },
      (error) => {
        console.error("Ошибка при подписке на данные Firestore:", error);
      }
    );

    return () => {
      unsubscribe();
      debouncedUpdate.cancel();
    };
  }, [user.id]);

  const getUserData = async (userData: UserData) => {
    try {
      const userDocRef = doc(db, "userData", userData.id);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userDataFromDb = userDoc.data() as UserData;
        console.log("Данные пользователя из Firestore:", userDataFromDb);
        setBalance(userDataFromDb.balance || 0);
        setCurrentRank(userDataFromDb.rank || RANKS[0]);
        setUser((prev) => ({
          ...prev,
          tasks: userDataFromDb.tasks || [],
          referals: userDataFromDb.referals || [],
          rank: userDataFromDb.rank || RANKS[0],
        }));
        // Преобразуем TaskData[] в Task[]
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
        };
        await setDoc(userDocRef, newUser);
        setBalance(0);
        setCurrentRank(RANKS[0]);
        setTasks(initialTasks); // Инициализируем задачи из initialTasks
      }
    } catch (error) {
      console.error("Ошибка при получении данных из Firestore:", error);
      setBalance(0);
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
              // Сохраняем рефералов в localStorage
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
            setBalanceState((prev) => prev + 100);
          }
        } else {
          console.log(
            `Реферал ${newUserId} уже существует у пользователя ${referrerId}`
          );
        }
      } else {
        console.log(`Пользователь с ID ${referrerId} не найден в Firestore`);
      }
    } catch (error) {
      console.error("Ошибка при обработке реферала:", error);
    }
  };

  // Эффект для синхронизации данных с Firestore только при изменении
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
        const docSnap = await getDoc(userDocRef);
        console.log("Документ существует:", docSnap.exists());
        await setDoc(userDocRef, userData, { merge: true });
        console.log(
          "Данные пользователя успешно обновлены в Firestore",
          userData
        );
      } catch (error) {
        console.error("Ошибка при обновлении данных пользователя:", error);
      }
    };

    // Проверяем изменения перед обновлением prevDataRef
    if (hasDataChanged()) {
      console.log("Данные изменились, планируем синхронизацию");
      const debouncedSync = debounce(syncWithFirestore, 500);
      debouncedSync();
    }

    // Обновляем prevDataRef после проверки изменений
    prevDataRef.current = { balance, tasks, currentRank };

    // Очистка при размонтировании
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
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
      />
    </Router>
  );
}

export default App;
