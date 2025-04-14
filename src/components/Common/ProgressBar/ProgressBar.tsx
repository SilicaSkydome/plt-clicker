import React from "react";
import "./ProgressBar.css";
import { Rank } from "../../../Interfaces"; // Импортируем интерфейс Rank

interface ProgressBarProps {
  balance: number; // Текущий баланс игрока
  currentRank: Rank; // Текущий ранг игрока
  ranks: Rank[]; // Массив всех рангов
}

function ProgressBar({ balance, currentRank, ranks }: ProgressBarProps) {
  // Находим индекс текущего ранга в массиве ranks
  const currentRankIndex = ranks.findIndex(
    (rank) => rank.title === currentRank.title
  );

  // Определяем минимальное и максимальное значение золота для текущего ранга
  const minGold = currentRank.goldMin;
  const maxGold = currentRank.goldMax ?? Infinity; // Если goldMax равно null (для Captain), используем Infinity

  // Вычисляем прогресс в текущем ранге
  const progressInRank = Math.min(
    ((balance - minGold) / (maxGold - minGold)) * 100,
    100
  ); // Процент прогресса в текущем ранге

  // Определяем следующий ранг и сколько золота осталось до него
  const nextRank =
    currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const goldToNextRank = nextRank ? nextRank.goldMin - balance : 0; // Сколько осталось до следующего ранга

  return (
    <div className="progressBar">
      <div className="progressBar-container">
        <div
          className="progressBar-fill"
          style={{ width: `${progressInRank}%` }} // Динамически задаем ширину заполненной части
        />
      </div>
      <div className="progressBar-label">
        {nextRank ? (
          // Если есть следующий ранг, показываем прогресс и сколько осталось
          <>
            {progressInRank.toFixed(0)}% / {goldToNextRank.toFixed(0)} to{" "}
            {nextRank.title}
          </>
        ) : (
          // Если игрок уже Captain, показываем только 100%
          "100% / Captain Reached!"
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
