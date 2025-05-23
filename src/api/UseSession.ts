import { useEffect, useState } from "react";
import { db } from "../../firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

// Тип для данных сессии
interface SessionData {
  userId: string;
  sessionId: string;
  timestamp: string;
  active: boolean;
}

// Генерация уникального sessionId
const generateSessionId = (): string => {
  return crypto.randomUUID();
};

const useSession = (userId: string) => {
  const [isSessionBlocked, setIsSessionBlocked] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      console.log("Пустой ID пользователя, пропускаем управление сессией");
      return;
    }

    const HEARTBEAT_INTERVAL = 5 * 1000; // 5 секунд
    const SESSION_INACTIVE_TIMEOUT = 10 * 1000; // 10 секунд
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const startSession = async () => {
      const sessionRef = doc(db, "sessions", userId);
      const sessionSnap = await getDoc(sessionRef);

      const currentTime = Date.now();
      const storedSessionId = localStorage.getItem(`session_${userId}`);

      if (sessionSnap.exists()) {
        const sessionData = sessionSnap.data() as SessionData;
        const sessionTimestamp = new Date(sessionData.timestamp).getTime();
        const timeSinceLastHeartbeat = currentTime - sessionTimestamp;

        // Если сессия активна и sessionId совпадает с сохранённым, продолжаем
        if (
          sessionData.active &&
          storedSessionId &&
          sessionData.sessionId === storedSessionId &&
          timeSinceLastHeartbeat < SESSION_INACTIVE_TIMEOUT
        ) {
          console.log("Это та же сессия после перезагрузки, продолжаем", {
            sessionId: storedSessionId,
          });
          await updateDoc(sessionRef, {
            timestamp: new Date().toISOString(),
          });
          setSessionId(storedSessionId);
          setIsSessionBlocked(false);
        }
        // Если сессия активна, но sessionId не совпадает, блокируем
        else if (
          sessionData.active &&
          timeSinceLastHeartbeat < SESSION_INACTIVE_TIMEOUT
        ) {
          console.log("Сессия активна в другой вкладке, блокируем", {
            activeSessionId: sessionData.sessionId,
          });
          setIsSessionBlocked(true);
          return;
        }
      }

      // Если сессии нет или она неактивна, создаём новую
      const newSessionId = generateSessionId();
      localStorage.setItem(`session_${userId}`, newSessionId);
      await setDoc(sessionRef, {
        userId,
        sessionId: newSessionId,
        timestamp: new Date().toISOString(),
        active: true,
      });
      setSessionId(newSessionId);
      setIsSessionBlocked(false);
      console.log("Запуск новой сессии", { sessionId: newSessionId });

      // Запускаем heartbeat
      heartbeatInterval = setInterval(async () => {
        const currentSessionSnap = await getDoc(sessionRef);
        if (currentSessionSnap.exists()) {
          const currentSessionData = currentSessionSnap.data() as SessionData;
          if (currentSessionData.sessionId !== newSessionId) {
            console.log("Сессия перехвачена другой вкладкой, блокируем");
            setIsSessionBlocked(true);
            if (heartbeatInterval) clearInterval(heartbeatInterval);
            return;
          }

          await updateDoc(sessionRef, {
            timestamp: new Date().toISOString(),
          });
          console.log("Heartbeat обновлён", { sessionId: newSessionId });
        }
      }, HEARTBEAT_INTERVAL);
    };

    startSession();

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [userId]);

  return { isSessionBlocked };
};

export default useSession;
