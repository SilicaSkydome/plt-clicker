// pages/Earn/Earn.tsx
import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../store";
import { Task, TaskData } from "../../Interfaces";
import { initialTasks } from "../../Data";
import { useEarnLogic } from "./useEarnLogic";
import QuestCard from "./QuestCard";
import "./Earn.css";

const Earn: React.FC = () => {
  const user = useAppSelector((state) => state.user.user);
  const [taskDataList, setTaskDataList] = useState<TaskData[]>(
    initialTasks.map(({ action, ...rest }) => ({ ...rest, completed: false }))
  );
  const [balance, setBalance] = useState<number>(user?.balance || 0);

  const enhancedTasks: Task[] = initialTasks.map((task) => {
    const saved = taskDataList.find((t) => t.title === task.title);
    return {
      ...task,
      completed: saved?.completed ?? false,
    };
  });

  const { handleTaskClick } = useEarnLogic(
    enhancedTasks,
    setTaskDataList,
    setBalance
  );

  return (
    <div className="earnPage">
      <div className="earnPanel">
        <h1>Quests</h1>
        <p>Complete tasks to earn gold</p>
        <div className="questsList">
          {enhancedTasks.map((task) => (
            <QuestCard
              key={task.title}
              task={task}
              onClick={() => handleTaskClick(task)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Earn;
