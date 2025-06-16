import React from "react";
import "./ProgressBar.css";
import { ProgressBarProps, Rank } from "../../../Interfaces"; // Импортируем интерфейс Rank
import Compass from "../../../assets/img/Compass.svg"; // Импортируем изображение компаса

function ProgressBar({ balance, currentRank, ranks }: ProgressBarProps) {
  // Находим индекс текущего ранга в массиве ranks
  const currentRankIndex = ranks.findIndex(
    (rank) => rank.title === currentRank.title
  );

  // Определяем следующий ранг и сколько золота осталось до него
  const nextRank =
    currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const goldToNextRank = nextRank ? nextRank.goldMin - balance : 0; // Сколько осталось до следующего ранга

  return (
    <div className="progressBar">
      <div className="compass">
        <img src={Compass} alt="Compass" />
        <div className="label">
          next rank
          <br />
          <span>{nextRank ? goldToNextRank.toFixed(0) : ""}</span>
        </div>
      </div>
    </div>
  );
}

export default ProgressBar;
