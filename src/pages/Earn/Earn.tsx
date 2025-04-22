import React, { useEffect } from "react";
import "./Earn.css";
import { useNavigate } from "react-router-dom";
import { Task, TaskData, UserData } from "../../Interfaces";
import { db } from "../../../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

interface EarnProps {
  user: UserData;
  balance: number;
  setBalance: (balance: number) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

function Earn({ balance, setBalance, user, tasks, setTasks }: EarnProps) {
  const navigate = useNavigate();

  const handleTaskClick = async (task: Task, index: number) => {
    if (task.completed) return;

    const shouldComplete = task.action(balance, setBalance, user, navigate);
    if (shouldComplete) {
      setBalance(parseFloat((balance + task.points).toFixed(2))); // Обновляем баланс пользователя
      const updatedTasks = tasks.map((t: Task, i: number) =>
        i === index ? { ...t, completed: true } : t
      );
      setTasks(updatedTasks);

      // Обновляем задачи в Firestore
      const tasksToSave = updatedTasks.map(({ action, ...rest }) => rest);
      const userDocRef = doc(db, "userData", user.id);
      try {
        await updateDoc(userDocRef, {
          tasks: tasksToSave,
        });
        console.log("Задачи обновлены в Firestore:", tasksToSave);
      } catch (error) {
        console.error("Ошибка при обновлении задач в Firestore:", error);
      }
    }
  };

  return (
    <div className="earnPage">
      <div className="earnSection">
        <h1>Earn</h1>
        <h2>tasks available</h2>
        <p>
          We’ll reward you immediately with points after each task completion
        </p>
        <div className="quests">
          {tasks.map((task, index) => (
            <div key={index} className="quest">
              <div className="questContent">
                <div className="questIcon">
                  <img src={task.icon} alt="icon" />
                </div>
                <div className="questInfo">
                  <h3>{task.title}</h3>
                  <p>{task.description}</p>
                </div>
              </div>
              <button
                className="questButton"
                disabled={task.completed}
                onClick={() => handleTaskClick(task, index)}
              >
                {task.completed ? "Completed" : `+${task.points} PLGold`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Earn;
