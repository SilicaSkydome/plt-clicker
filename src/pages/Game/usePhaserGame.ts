import { useEffect, useRef } from "react";
import Phaser from "phaser";
import {
  shipTextures,
  shipScaleAdjustments,
  MIN_CHEST_DISTANCE,
  chestTextures,
  ringTextures,
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
  const chestDataRef = useRef<
    Array<{
      chest: Phaser.GameObjects.Image | null;
      rings: Phaser.GameObjects.Image[];
      x: number;
      y: number;
      id: number;
    }>
  >([]);
  const lastVisibleCountRef = useRef<number | null>(null);
  const isTestMode = false; // Set to true for testing purposes

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
        update: function (this: Phaser.Scene) {
          const visibleCount = chestDataRef.current.filter(
            (entry) => entry.chest?.active && entry.chest?.visible
          ).length;

          if (lastVisibleCountRef.current !== visibleCount) {
            console.log(`Active chests changed: ${visibleCount} visible`);
            lastVisibleCountRef.current = visibleCount;
          }
        },
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
      Object.values(ringTextures).forEach((key) => this.load.image(key, key));
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
      chestsRef.current = [];

      chestsData.forEach((chest) => {
        if (shouldRespawn(chest.lastSpawnTime)) {
          // Improved positioning logic
          const headerHeight = 80;
          const maxDistance = 200;
          const boatX = boatRef.current?.x || baseWidth / 2;
          const boatY = boatRef.current?.y || baseHeight / 2;

          let x, y, distance;
          let attempts = 0;
          const maxAttempts = 10;

          do {
            x = boatX + (Math.random() - 0.5) * maxDistance * 2;
            y = boatY + (Math.random() - 0.5) * maxDistance * 2;
            distance = Math.sqrt((x - boatX) ** 2 + (y - boatY) ** 2);
            attempts++;
          } while (
            (distance < MIN_CHEST_DISTANCE ||
              distance > maxDistance ||
              x < 25 ||
              x > baseWidth - 25 ||
              y < headerHeight + 25 ||
              y > baseHeight - 25) &&
            attempts < maxAttempts
          );

          if (attempts >= maxAttempts) {
            console.warn("Could not find valid position for chest");
            return;
          }

          const chestSprite = this.add
            .image(x, y, chestTextures.commonChest)
            .setInteractive({ useHandCursor: true })
            .setDepth(3)
            .setScale(0.05 * scaleFactor);

          const rings: Phaser.GameObjects.Sprite[] = [];

          Object.values(ringTextures).forEach((key, index) => {
            const ring = this.add
              .sprite(x, y, key)
              .setDepth(0)
              .setScale(0) as Phaser.GameObjects.Sprite;

            const ringTexture = this.textures
              .get(key)
              .getSourceImage() as HTMLImageElement;
            const ringOriginalWidth = ringTexture.width;
            const desiredRingWidth = baseWidth * (0.3 + index * 0.07);
            const ringScale = desiredRingWidth / ringOriginalWidth;
            const minRingScale = 0.2 + index * 0.07;
            const maxRingScale = ringScale;

            this.tweens.add({
              targets: ring,
              scale: { from: minRingScale, to: maxRingScale },
              duration: 3000,
              delay: index * 500,
              ease: "Sine.easeInOut",
              repeat: -1,
              yoyo: true,
            });

            this.tweens.add({
              targets: ring,
              alpha: { from: 0.4, to: 1 },
              duration: 3000,
              delay: index * 500,
              ease: "Sine.easeInOut",
              repeat: -1,
              yoyo: true,
            });

            rings.push(ring);
          });
          const chestEntry = {
            chest: chestSprite,
            rings,
            x,
            y,
            id: chest.id,
          };
          chestDataRef.current.push(chestEntry);
          handleChestClick(
            chestSprite,
            chest,
            currentSceneRef.current!,
            setClickQueue,
            dispatch,
            scaleFactor,
            rings,
            chestDataRef
          );

          chestsRef.current.push(chestSprite);

          const updatedChest: ChestData = {
            ...chest,
            x,
            y,
            lastSpawnTime: null,
          };

          saveChestData(updatedChest);
        }
      });
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
