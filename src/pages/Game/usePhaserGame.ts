import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {
  shipTextures,
  shipScaleAdjustments,
  MIN_CHEST_DISTANCE,
  chestTextures,
} from "./config";
import { useAppDispatch, useAppSelector } from "../../store";
import { handleBoatClick, handleChestClick } from "./utils";
import { loadChestData, saveChestData, shouldRespawn } from "./useChests";
import { ChestData } from "../../Interfaces";

export function usePhaserGame(
  containerRef: React.RefObject<HTMLDivElement | null>,
  baseWidth: number,
  baseHeight: number,
  scaleFactor: number,
  selectedShip: string,
  energyRef: React.MutableRefObject<number>,
  lastEnergyUpdateRef: React.MutableRefObject<number>,
  syncDisplayEnergy: () => void,
  setClickQueue: React.Dispatch<
    React.SetStateAction<
      { type: string; points: number; energyAtClick: number }[]
    >
  >
) {
  const gameInstance = useRef<Phaser.Game | null>(null);
  const boatRef = useRef<Phaser.GameObjects.Image | null>(null);
  const currentSceneRef = useRef<Phaser.Scene | null>(null);
  const chestsRef = useRef<Phaser.GameObjects.Image[]>([]);
  const dispatch = useAppDispatch();
  const currentRank = useAppSelector((state) => state.game.rank);
  const userId = useAppSelector(
    (state) => state.user.user?.id ?? "test_user_123"
  );
  const isTestMode = window.env?.VITE_TEST_MODE === "true";

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: baseWidth,
      height: baseHeight,
      parent: containerRef.current!,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: baseWidth,
        height: baseHeight,
      },
      scene: {
        preload,
        create,
        update,
      },
      input: {
        activePointers: 3,
      },
    };

    function preload(this: Phaser.Scene) {
      Object.values(shipTextures).forEach((key) => {
        this.load.image(key, key);
      });
      Object.values(chestTextures).forEach((key) => {
        this.load.image(key, key);
      });
    }

    async function create(this: Phaser.Scene) {
      currentSceneRef.current = this;

      // Корабль
      const textureKey = shipTextures[selectedShip] || "ship1";
      boatRef.current = this.add
        .image(baseWidth / 2, baseHeight / 2, textureKey)
        .setInteractive({ useHandCursor: true, pixelPerfect: true })
        .setDepth(2);

      const baseBoatScale = 0.25 * scaleFactor;
      const adjustment = shipScaleAdjustments[textureKey] || 1.0;
      const finalScale = baseBoatScale * adjustment;
      boatRef.current.setScale(finalScale);

      this.tweens.add({
        targets: boatRef.current,
        y: baseHeight / 2 + 10 * scaleFactor,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      if (boatRef.current && currentSceneRef.current) {
        handleBoatClick(
          boatRef.current,
          currentSceneRef.current,
          energyRef,
          lastEnergyUpdateRef,
          syncDisplayEnergy,
          setClickQueue,
          currentRank,
          dispatch,
          scaleFactor
        );
      }

      // Сундуки
      const chestsData = await loadChestData(
        userId,
        isTestMode,
        baseWidth,
        baseHeight
      );
      console.log("Loaded chests:", chestsData);
      chestsRef.current = [];

      chestsData.forEach((chest) => {
        if (shouldRespawn(chest.lastSpawnTime)) {
          // Ограничиваем область спавна (отступ от хедера и ближе к кораблю)
          const headerHeight = 80; // Примерная высота хедера (проверь в Header.css)
          const maxDistance = 200; // Максимальное расстояние от корабля
          let x, y, distance;
          const boatX = boatRef.current?.x || baseWidth / 2;
          const boatY = boatRef.current?.y || baseHeight / 2;

          do {
            x = boatX + (Math.random() - 0.5) * maxDistance * 2;
            y = boatY + (Math.random() - 0.5) * maxDistance * 2;
            distance = Math.sqrt((x - boatX) ** 2 + (y - boatY) ** 2);
          } while (
            distance < MIN_CHEST_DISTANCE ||
            distance > maxDistance ||
            x < 25 ||
            x > baseWidth - 25 ||
            y < headerHeight + 25 ||
            y > baseHeight - 25
          );

          const chestSprite = this.add
            .image(x, y, chestTextures.commonChest)
            .setInteractive({ useHandCursor: true })
            .setDepth(1)
            .setScale(0.05 * scaleFactor);

          handleChestClick(
            chestSprite,
            chest,
            currentSceneRef.current!,
            setClickQueue,
            dispatch,
            scaleFactor
          );

          chestsRef.current.push(chestSprite);

          const updatedChest: ChestData = {
            ...chest,
            x,
            y,
            lastSpawnTime: null, // Не обновляем lastSpawnTime при спавне
          };
          saveChestData(updatedChest);
        }
      });
    }

    function update(this: Phaser.Scene) {
      // Логика обновления, если потребуется
    }

    if (!gameInstance.current) {
      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
        boatRef.current = null;
        currentSceneRef.current = null;
        chestsRef.current = [];
      }
    };
  }, [baseWidth, baseHeight, scaleFactor, selectedShip, userId, isTestMode]);

  return { boatRef, gameInstance, currentSceneRef, chestsRef };
}
