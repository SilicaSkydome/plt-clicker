import React from "react";
import "./EnergyBar.css";

interface EnergyBarProps {
  currentEnergy: number;
  maxEnergy: number;
}

function EnergyBar({ currentEnergy, maxEnergy }: EnergyBarProps) {
  const progress = Math.min((currentEnergy / maxEnergy) * 100, 100);

  return (
    <div className="energyBar">
      <div className="energyBar-container">
        <div className="energyBar-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

export default EnergyBar;
