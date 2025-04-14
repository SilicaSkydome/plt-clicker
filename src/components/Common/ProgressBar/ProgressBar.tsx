import React from "react";
import "./ProgressBar.css";

interface ProgressBarProps {
  balance: number; // Текущий баланс игрока
}

function ProgressBar({ balance }: ProgressBarProps) {
  const maxBalance = 30000; // Максимальное значение баланса для 100% заполнения (ранг Captain)
  const progressPercentage = Math.min((balance / maxBalance) * 100, 100); // Вычисляем процент прогресса, ограничивая 100%

  return (
    <div className="progressBar">
      <div className="progressBar-container">
        <div
          className="progressBar-fill"
          style={{ width: `${progressPercentage}%` }} // Динамически задаем ширину заполненной части
        />
      </div>
      <div className="progressBar-label">
        {progressPercentage.toFixed(0)}% / Captain
      </div>
    </div>
  );
}

export default ProgressBar;
