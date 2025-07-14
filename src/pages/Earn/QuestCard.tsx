// pages/Earn/QuestCard.tsx
import React from "react";
import { Task } from "../../Interfaces";
import "./QuestCard.css";

interface QuestCardProps {
  task: Task;
  onClick: () => void;
}

const QuestCard: React.FC<QuestCardProps> = ({ task, onClick }) => {
  console.log(task);
  return (
    <div className={`questCard ${task.completed ? "completed" : "active"}`}>
      <div className="questContent">
        <img src={task.icon} alt={task.title} className="questIcon" />
        <div className="questInfo">
          <h3 className="questTitle">{task.title}</h3>
          <p className="questDesc">{task.description}</p>
          <span className="questPoints">+{task.points} pts</span>
        </div>
      </div>
      <button
        className="questButton"
        onClick={onClick}
        disabled={task.completed}
      >
        {task.completed ? "Done" : task.description}
      </button>
    </div>
  );
};

export default QuestCard;
