import React from "react";
import "./Earn.css";

const tasks = [
  {
    icon: "./assets/Quest1.png",
    title: "Subscribe to Telegram",
    description: "+15 PLGold",
    button: "",
    points: 15,
    completed: false,
  },
  {
    icon: "./assets/Quest2.png",
    title: "Invite 5 friends",
    description: "15 PLGold",
    button: "",
    points: 25,
    completed: false,
  },
  {
    icon: "./assets/Quest3.png",
    title: "Join instagram",
    description: "15 PLGold",
    button: "",
    points: 15,
    completed: false,
  },
];

function Earn() {
  return (
    <div className="earnPage">
      <div className="earnSection">
        <h1>Earn</h1>
        <h2> tasks available</h2>
        <p>
          We’ll reward you immediately width points after each task completion
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
              <button className="questButton">+{task.points} PLGold</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Earn;
