// components/Common/EnergyBar/EnergyBar.tsx
import React from "react";
import { useAppSelector } from "../../../store";
import "./EnergyBar.css";

const EnergyBar = () => {
  const energy = useAppSelector((state) => state.game.energy);
  const maxEnergy = useAppSelector((state) => state.game.maxEnergy);

  const percentage = (energy / maxEnergy) * 100;

  return (
    <div className="energyBarWrapper">
      <div className="energyBar">
        <div className="energyFill" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default EnergyBar;
