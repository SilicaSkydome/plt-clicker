import React from "react";
import "./Earn.css";
import { useNavigate } from "react-router-dom";
import { Task, TaskData, UserData } from "../../Interfaces";

// Определяем начальный список задач
const initialTasks: Task[] = [
  {
    icon: "./assets/Quest1.png",
    title: "Subscribe to Telegram",
    description: "+15 PLGold",
    button: "",
    points: 15,
    completed: false,
    action: (balance, setBalance) => {
      // Используем Telegram.WebApp.openLink вместо window.open
      //@ts-ignore
      if (window.Telegram?.WebApp) {
        //@ts-ignore
        window.Telegram.WebApp.openLink("https://t.me/PirateLife1721");
      } else {
        // Fallback для случаев, если Telegram API недоступен
        window.open("https://t.me/PirateLife1721", "_blank");
      }
      return true; // Пока просто возвращаем true
    },
  },
  {
    icon: "./assets/Quest2.png",
    title: "Invite 5 friends",
    description: "+15 PLGold",
    button: "",
    points: 25,
    completed: false,
    action: (balance, setBalance, user, navigate) => {
      if (user) {
        if (user.referals && user.referals?.length < 5) {
          navigate("/invite");
          return false; // Задача не выполнена
        } else if (user.referals && user.referals?.length >= 5) {
          return true; // Задача выполнена
        } else {
          navigate("/invite");
          return false; // Задача не выполнена
        }
      }
      return false;
    },
  },
  {
    icon: "./assets/Quest3.png",
    title: "Join instagram",
    description: "+15 PLGold",
    button: "",
    points: 15,
    completed: false,
    action: (balance, setBalance) => {
      window.open("https://www.instagram.com/piratelife_official/", "_blank");
      return true; // Возвращаем true, чтобы отметить задачу как выполненную
    },
  },
];

interface EarnProps {
  user: UserData;
  balance: number;
  setBalance: (balance: number) => void;
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
}

function Earn({ balance, setBalance, user, tasks, setTasks }: EarnProps) {
  const navigate = useNavigate();

  const syncTasksWithInitial = (firestoreTasks: TaskData[]): Task[] => {
    return initialTasks.map((initialTask) => {
      const firestoreTask = firestoreTasks.find(
        (task) => task.title === initialTask.title
      );
      return firestoreTask
        ? { ...initialTask, completed: firestoreTask.completed }
        : initialTask;
    });
  };

  React.useEffect(() => {
    const syncedTasks = syncTasksWithInitial(user.tasks);
    setTasks(syncedTasks);
  }, [user.tasks, setTasks]); // Зависимость от user.tasks

  const handleTaskClick = (task: Task, index: number) => {
    if (task.completed) return;

    const shouldComplete = task.action(balance, setBalance, user, navigate);
    if (shouldComplete) {
      setBalance(balance + task.points);
      const updatedTasks = tasks.map((t: Task, i: number) =>
        i === index ? { ...t, completed: true } : t
      );
      setTasks(updatedTasks);
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
