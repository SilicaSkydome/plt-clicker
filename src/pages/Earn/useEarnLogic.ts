// pages/Earn/useEarnLogic.ts
import { useAppSelector } from "../../store";
import { db } from "../../../firebaseConfig";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useCallback } from "react";
import { Task, TaskData } from "../../Interfaces";
import { useNavigate } from "react-router-dom";

export function useEarnLogic(
  tasks: Task[],
  setTaskDataList: React.Dispatch<React.SetStateAction<TaskData[]>>,
  setBalance: (newBalance: number) => void
) {
  const user = useAppSelector((state) => state.user.user);
  const balance = useAppSelector((state) => state.game.balance);
  const navigate = useNavigate();

  const handleTaskClick = useCallback(
    async (task: Task) => {
      if (
        !user?.id ||
        task.completed ||
        typeof task.action !== "function" ||
        !task.action(balance, setBalance, user, navigate)
      ) {
        return;
      }

      const q = query(collection(db, "userData"), where("id", "==", user.id));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const docRef = snapshot.docs[0].ref;

        const updatedTaskDataList: TaskData[] = tasks.map(({ action, ...t }) =>
          t.title === task.title ? { ...t, completed: true } : t
        );

        const newBalance = balance + (task.points || 0);

        await updateDoc(docRef, {
          balance: newBalance,
          tasks: updatedTaskDataList,
        });

        setBalance(newBalance);
        setTaskDataList(updatedTaskDataList);
      }
    },
    [user?.id, balance, tasks, setTaskDataList, setBalance, navigate]
  );

  return { handleTaskClick };
}
