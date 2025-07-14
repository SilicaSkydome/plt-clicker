// components/Common/ProgressBar/ProgressBar.tsx
import React from "react";
import { useAppSelector } from "../../../store";
import { ranks } from "../../../Data";
import "./ProgressBar.css";

const ProgressBar = () => {
  const balance = useAppSelector((state) => state.game.balance);
  const currentRank = useAppSelector((state) => state.game.rank);

  const currentIndex = ranks.findIndex((r) => r.title === currentRank.title);
  const nextRank = ranks[currentIndex + 1];
  const progressPercent = nextRank?.goldMax
    ? Math.min((balance / nextRank.goldMax) * 100, 100)
    : 100;

  return (
    <div className="progressBarWrapper">
      <div className="label">
        {nextRank
          ? `Next rank in: ${Math.max(
              0,
              (nextRank.goldMax ?? 0) - balance
            ).toFixed(0)}`
          : "Max Rank"}
      </div>
      <div className="progressBar">
        <div
          className="progressFill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
