import React, { useEffect } from "react";
import { useAppSelector } from "../../store";
import { Task, TaskData } from "../../Interfaces";
import { initialTasks } from "../../Data";
import { useEarnLogic } from "./useEarnLogic";
import QuestCard from "./QuestCard";
import "./Earn.css";

const Earn: React.FC = () => {
  const user = useAppSelector((state) => state.user.user);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const balance = useAppSelector((state) => state.game.balance);

  const enhancedTasks: Task[] = initialTasks.map((task) => {
    const saved = tasks.find((t) => t.title === task.title);
    return {
      ...task,
      completed: saved?.completed ?? false,
    };
  });

  const { handleTaskClick } = useEarnLogic(
    enhancedTasks,
    () => {},
    () => {}
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
