// pages/Stats/Stats.tsx
import React from "react";
import "./Stats.css";
import top1 from "../../assets/img/top-1.png";
import top2 from "../../assets/img/top-2.png";
import top3 from "../../assets/img/top-3.png";
import { useLeaderboard } from "./useLeaderboard";

function Stats() {
  const { players, loading, error } = useLeaderboard(30);

  if (loading) return <div className="statsPage">Loading leaderboard...</div>;
  if (error) return <div className="statsPage">Error: {error}</div>;

  const topThree = players.slice(0, 3);
  const others = players.slice(3);

  return (
    <div className="statsPage">
      <div className="statsPanel">
        <h1 className="statsTitle">STATS</h1>
        <div className="topThree">
          {topThree.map((player) => (
            <div key={player.rank} className={`topPlayer rank-${player.rank}`}>
              <div className="avatarWrapper">
                <img src={player.avatar} alt={player.name} className="avatar" />
                <div className="rankBadge">
                  {player.rank === 1 ? (
                    <img src={top1} alt="Gold Medal" className="medal" />
                  ) : player.rank === 2 ? (
                    <img src={top2} alt="Silver Medal" className="medal" />
                  ) : player.rank === 3 ? (
                    <img src={top3} alt="Bronze Medal" className="medal" />
                  ) : null}
                </div>
              </div>
              <p className="playerName">{player.name}</p>
              <p className="playerRank">{player.title}</p>
              <p className="playerBalance">{player.balance.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="statList">
        {others.map((player) => (
          <div key={player.rank} className="statItem">
            <span className="rank">{player.rank}</span>
            <img src={player.avatar} alt={player.name} className="listAvatar" />
            <span className="listName">{player.name}</span>
            <span className="listBalance">
              Balance: <br />
              {player.balance.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stats;
