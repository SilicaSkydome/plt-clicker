// pages/Earn/QuestCard.tsx
import React from "react";
import { Task } from "../../Interfaces";

interface QuestCardProps {
  task: Task;
  onClick: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ task, onClick }) => {
  return (
    <div
      className={`questCard ${task.completed ? "completed" : "active"}`}
      onClick={onClick}
    >
      <img src={task.icon} alt={task.title} className="questIcon" />
      <div className="questDetails">
        <h3 className="questTitle">{task.title}</h3>
        <p className="questDesc">{task.description}</p>
        <span className="questPoints">+{task.points} pts</span>
      </div>
      <button className="questBtn" disabled={task.completed}>
        {task.completed ? "Done" : task.button}
      </button>
    </div>
  );
};

export default QuestCard;
