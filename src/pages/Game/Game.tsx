// pages/Game/Game.tsx
import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../store";
import Header from "../../components/Header/Header";
import EnergyBar from "../../components/Common/EnergyBar/EnergyBar";
import useEnergy from "./useEnergy";
import { usePhaserGame } from "./usePhaserGame";
import { ranks } from "../../Data";

function Game() {
  const user = useAppSelector((state) => state.user.user);
  const currentRank = useAppSelector((state) => state.game.rank);
  const maxEnergy = useAppSelector((state) => state.game.maxEnergy);

  const baseWidth = window.innerWidth;
  const baseHeight = window.innerHeight - 100;
  const scaleFactor = baseWidth / 360;
  const gameRef = useRef<HTMLDivElement>(null);

  console.log("Game component rendered with user:", user);

  const { displayEnergy } = useEnergy(maxEnergy);
  const { boatRef } = usePhaserGame(
    gameRef,
    baseWidth,
    baseHeight,
    scaleFactor,
    user?.selectedShip || "ship1"
  );

  if (!user) return <div>Загрузка...</div>;

  return (
    <>
      <Header />
      <div ref={gameRef} className="game-container" />
      <EnergyBar />
    </>
  );
}

export default Game;
