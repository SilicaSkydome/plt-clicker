import React, { useRef, useState, useEffect } from "react";
import { useAppSelector } from "../../store";
import Header from "../../components/Header/Header";
import EnergyBar from "../../components/Common/EnergyBar/EnergyBar";
import useEnergy from "./useEnergy";
import { usePhaserGame } from "./usePhaserGame";
import { processClickQueue } from "./utils";
import { useVisibilitySync } from "./useVisibility";
import { shipScaleAdjustments } from "./config";

function Game() {
  const user = useAppSelector((state) => state.user.user);
  const currentRank = useAppSelector((state) => state.game.rank);
  const maxEnergy = useAppSelector((state) => state.game.maxEnergy);
  const balance = useAppSelector((state) => state.game.balance);
  const isTestMode = window.env?.VITE_TEST_MODE === "true";

  const baseWidth = window.innerWidth;
  const baseHeight = window.innerHeight - 100;
  const scaleFactor = baseWidth / 360;
  const gameRef = useRef<HTMLDivElement>(null);

  const { displayEnergy, syncDisplay, energyRef, lastUpdateRef } =
    useEnergy(maxEnergy);
  const [clickQueue, setClickQueue] = useState<
    { type: string; points: number; energyAtClick: number }[]
  >([]);

  console.log(
    "Game component rendered, user:",
    user,
    "balance:",
    balance,
    "clickQueue:",
    clickQueue
  );

  const { boatRef, gameInstance, currentSceneRef, chestsRef } = usePhaserGame(
    gameRef,
    baseWidth,
    baseHeight,
    scaleFactor,
    user?.selectedShip || "ship1",
    energyRef,
    lastUpdateRef,
    syncDisplay,
    setClickQueue
  );
  useVisibilitySync(energyRef, lastUpdateRef, syncDisplay, maxEnergy);
  useEffect(() => {
    // Обрабатываем очередь кликов
    processClickQueue(clickQueue, setClickQueue, isTestMode);
  }, [clickQueue, isTestMode]);

  useEffect(() => {
    const handleResize = () => {
      const newBaseWidth = window.innerWidth;
      const newBaseHeight = window.innerHeight - 100;
      const newScaleFactor = newBaseWidth / 360;

      if (gameInstance.current) {
        gameInstance.current.scale.resize(newBaseWidth, newBaseHeight);
      }

      if (boatRef.current) {
        boatRef.current.setPosition(newBaseWidth / 2, newBaseHeight / 2);
        const textureKey = boatRef.current.texture.key;
        const baseBoatScale = 0.25 * newScaleFactor;
        const adjustment = shipScaleAdjustments[textureKey] || 1.0;
        boatRef.current.setScale(baseBoatScale * adjustment);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
