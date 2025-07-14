import { useAppSelector, useAppDispatch } from "../../store";
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
import { completeTask } from "../../store/tasksSlice";
import { updateBalance } from "../../store/gameSlice";

export function useEarnLogic(
  tasks: Task[],
  setTaskDataList: React.Dispatch<React.SetStateAction<TaskData[]>>,
  setBalance: (newBalance: number) => void
) {
  const user = useAppSelector((state) => state.user.user);
  const balance = useAppSelector((state) => state.game.balance);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleTaskClick = useCallback(
    async (task: Task) => {
      if (
        !user?.id ||
        task.completed ||
        typeof task.action !== "function" ||
        !task.action(balance, setBalance, user, navigate)
      ) {
        console.log("Task click aborted:", { userId: user?.id, task });
        return;
      }

      try {
        const q = query(collection(db, "userData"), where("id", "==", user.id));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;

          const updatedTaskDataList: TaskData[] = tasks.map(
            ({ action, ...t }) =>
              t.title === task.title ? { ...t, completed: true } : t
          );

          const newBalance = balance + (task.points || 0);

          // Обновляем Firestore
          await updateDoc(docRef, {
            balance: newBalance,
            tasks: updatedTaskDataList,
          });

          // Синхронизируем с Redux
          dispatch(completeTask(task.title));
          dispatch(updateBalance(newBalance));

          // Обновляем локальное состояние
          setTaskDataList(updatedTaskDataList);
          setBalance(newBalance);

          console.log(
            "Task completed:",
            task.title,
            "New balance:",
            newBalance
          );
        } else {
          console.error("User document not found for id:", user.id);
        }
      } catch (error) {
        console.error("Failed to complete task:", error);
      }
    },
    [user?.id, balance, tasks, setTaskDataList, setBalance, dispatch, navigate]
  );

  return { handleTaskClick };
}
