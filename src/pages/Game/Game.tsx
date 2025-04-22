import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import React from "react";
import chest from "../../assets/img/chestPlaceholder.webp";
import ring1 from "../../assets/img/circles/1.png";
import ring2 from "../../assets/img/circles/2.png";
import ring3 from "../../assets/img/circles/3.png";
import shipPlaceholder from "../../assets/img/shipPlaceholder.png";
import "./Game.css";
import ProgressBar from "../../components/Common/ProgressBar/ProgressBar";
import { db } from "../../../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Rank } from "../../Interfaces";

interface GameProps {
  balance: number;
  setBalance: (balance: number) => void;
  currentRank: Rank;
  ranks: Rank[];
}

interface ChestData {
  x: number;
  y: number;
  id: number;
  lastSpawnTime: number | null;
  userId: string;
}

function Game({ balance, setBalance, currentRank, ranks }: GameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);

  const telegramUserId =
    //@ts-ignore
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || "default";

  useEffect(() => {
    setScore(balance);
  }, [balance]);

  useEffect(() => {
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight - 100;
    const aspectRatio = baseHeight / baseWidth;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight - 100;

    let gameWidth = containerWidth;
    let gameHeight = containerWidth * aspectRatio;

    if (gameHeight > containerHeight) {
      gameHeight = containerHeight;
      gameWidth = containerHeight / aspectRatio;
    }

    const referenceWidth = 360;
    const scaleFactor = gameWidth / referenceWidth;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: baseWidth,
      height: baseHeight,
      parent: gameRef.current!,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: baseWidth,
        height: baseHeight,
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    let currentScene: Phaser.Scene | null = null;
    let chestData: Array<{
      chest: Phaser.GameObjects.Sprite | null;
      rings: Phaser.GameObjects.Sprite[];
      x: number;
      y: number;
      id: number;
    }> = [];
    let lastVisibleCount: number | null = null;

    async function loadChestData(): Promise<ChestData[]> {
      try {
        const chestsQuery = query(
          collection(db, "chests"),
          where("userId", "==", telegramUserId)
        );
        const querySnapshot = await getDocs(chestsQuery);
        const savedChests: ChestData[] = [];
        querySnapshot.forEach((doc) => {
          savedChests.push(doc.data() as ChestData);
        });

        if (savedChests.length === 0) {
          const newChests: ChestData[] = [
            { x: 0, y: 0, id: 0, lastSpawnTime: null, userId: telegramUserId },
            { x: 0, y: 0, id: 1, lastSpawnTime: null, userId: telegramUserId },
            { x: 0, y: 0, id: 2, lastSpawnTime: null, userId: telegramUserId },
          ];
          for (const chest of newChests) {
            await saveChestData(chest);
          }
          return newChests;
        }
        return savedChests;
      } catch (error) {
        console.error("Error loading chest data:", error);
        return [
          { x: 0, y: 0, id: 0, lastSpawnTime: null, userId: telegramUserId },
          { x: 0, y: 0, id: 1, lastSpawnTime: null, userId: telegramUserId },
          { x: 0, y: 0, id: 2, lastSpawnTime: null, userId: telegramUserId },
        ];
      }
    }

    async function saveChestData(chest: ChestData) {
      try {
        const chestDocRef = doc(db, "chests", `${telegramUserId}_${chest.id}`);
        await setDoc(chestDocRef, chest);
      } catch (error) {
        console.error("Error saving chest data:", error);
      }
    }

    function preload(this: Phaser.Scene) {
      this.load.image("chest", chest);
      this.load.image("ring1", ring1);
      this.load.image("ring2", ring2);
      this.load.image("ring3", ring3);
      this.load.image("boat", shipPlaceholder);
    }

    function create(this: Phaser.Scene) {
      currentScene = this;

      const boat = this.add
        .image(baseWidth / 2, baseHeight / 2, "boat")
        .setInteractive()
        .setDepth(2) as Phaser.GameObjects.Image;

      const boatTexture = this.textures
        .get("boat")
        .getSourceImage() as HTMLImageElement;
      const boatOriginalWidth = boatTexture.width;
      const desiredBoatWidth = baseWidth * 0.5;
      const boatScale = desiredBoatWidth / boatOriginalWidth;
      boat.setScale(boatScale);

      this.tweens.add({
        targets: boat,
        y: baseHeight / 2 + 10 * scaleFactor,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      boat.on("pointerdown", () => {
        const basePoints = 0.01;
        const points = basePoints + currentRank.clickBonus;
        queueMicrotask(() => {
          setScore((prev) => {
            const newScore = parseFloat((prev + points).toFixed(2));
            setBalance(Number(newScore));

            const baseFontSize = 16;
            const fontSize = baseFontSize * scaleFactor;
            const plusText = currentScene!.add
              .text(boat.x, boat.y, `+${points.toFixed(2)}`, {
                fontSize: `${fontSize}px`,
                color: "#ffd700",
              })
              .setOrigin(0.5)
              .setDepth(4);

            const targetY = Math.max(boat.y - 30 * scaleFactor, 0);
            currentScene!.tweens.add({
              targets: plusText,
              y: targetY,
              alpha: 0,
              duration: 1000,
              onComplete: () => plusText.destroy(),
            });

            return newScore;
          });
        });
      });

      loadChestData().then((savedChests) => {
        savedChests.forEach((chest, index) => {
          let x, y;
          if (chest.x === 0 && chest.y === 0) {
            let attempts = 0;
            const maxAttempts = 10;

            do {
              x = Phaser.Math.Between(50, baseWidth - 50);
              y = Phaser.Math.Between(100, baseHeight - 100);
              attempts++;
            } while (
              isOverlapping(x, y, savedChests, boat, 50 * scaleFactor) &&
              attempts < maxAttempts
            );

            if (attempts >= maxAttempts) {
              console.warn(
                "Could not find a valid position for chest after max attempts."
              );
              return;
            }

            savedChests[index].x = x;
            savedChests[index].y = y;
            saveChestData(savedChests[index]);
          } else {
            x = chest.x;
            y = chest.y;
          }

          initializeChest(this, x, y, scaleFactor, index, chest.lastSpawnTime);
        });
      });
    }

    function isOverlapping(
      x: number,
      y: number,
      existingChests: Array<{ x: number; y: number }>,
      boat: Phaser.GameObjects.Image,
      minDistance: number
    ): boolean {
      const boatDistance = Phaser.Math.Distance.Between(x, y, boat.x, boat.y);
      if (boatDistance < minDistance * 2) return true;

      for (const chest of existingChests) {
        const distance = Phaser.Math.Distance.Between(x, y, chest.x, chest.y);
        if (distance < minDistance) return true;
      }
      return false;
    }

    function initializeChest(
      scene: Phaser.Scene,
      x: number,
      y: number,
      scaleFactor: number,
      id: number,
      lastSpawnTime: number | null
    ) {
      const currentTime = Date.now();
      const respawnInterval = 1 * 30 * 1000;

      if (!lastSpawnTime || currentTime - lastSpawnTime >= respawnInterval) {
        spawnChest(scene, x, y, scaleFactor, id);
      } else {
        const timeLeft = respawnInterval - (currentTime - lastSpawnTime);
        console.log(`Chest ${id} will respawn in ${timeLeft / 1000} seconds`);

        setTimeout(() => {
          if (currentScene) {
            spawnChest(currentScene, x, y, scaleFactor, id);
          }
        }, timeLeft);
      }
    }

    function spawnChest(
      scene: Phaser.Scene,
      x: number,
      y: number,
      scaleFactor: number,
      id: number
    ) {
      const chest = scene.add
        .sprite(x, y, "chest")
        .setInteractive()
        .setScale(0)
        .setDepth(3)
        .setActive(true) as Phaser.GameObjects.Sprite;

      // Проверяем размеры текстуры сундука
      const chestTexture = scene.textures
        .get("chest")
        .getSourceImage() as HTMLImageElement;

      // Задаем масштаб напрямую
      const finalChestScale = 0.04 * scaleFactor;

      // Добавляем кольца как sprites
      const rings: Phaser.GameObjects.Sprite[] = [];
      const ringKeys = ["ring1", "ring2", "ring3"];
      ringKeys.forEach((key, index) => {
        const ring = scene.add
          .sprite(x, y, key)
          .setDepth(0)
          .setScale(0) as Phaser.GameObjects.Sprite;

        const ringTexture = scene.textures
          .get(key)
          .getSourceImage() as HTMLImageElement;
        const ringOriginalWidth = ringTexture.width;
        // Увеличиваем размер колец пропорционально сундуку
        const desiredRingWidth = baseWidth * (0.3 + index * 0.07); // Увеличиваем базовый размер колец
        const ringScale = desiredRingWidth / ringOriginalWidth;
        const minRingScale = 0.2 + index * 0.07; // Увеличиваем минимальный масштаб
        const maxRingScale = ringScale;

        scene.tweens.add({
          targets: ring,
          scale: { from: minRingScale, to: maxRingScale },
          duration: 3000,
          delay: index * 500,
          ease: "Sine.easeInOut",
          repeat: -1,
          yoyo: true,
        });

        scene.tweens.add({
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

      // Анимация появления сундука
      scene.tweens.add({
        targets: chest,
        scale: finalChestScale,
        duration: 500,
        ease: "Bounce.easeOut",
        onComplete: () => {
          console.log("Final chest scale after tween:", chest.scale);
        },
      });

      const chestEntry = { chest, rings, x, y, id };
      chestData.push(chestEntry);

      chest.on("pointerdown", async () => {
        const basePoints = Phaser.Math.Between(3, 10);
        const points = basePoints + currentRank.clickBonus;
        queueMicrotask(() => {
          setScore((prev) => {
            const newScore = prev + points;
            setBalance(newScore);

            const baseFontSize = 16;
            const fontSize = baseFontSize * scaleFactor;
            const plusText = scene.add
              .text(chest.x, chest.y, `+${points.toFixed(2)}`, {
                fontSize: `${fontSize}px`,
                color: "#ffd700",
              })
              .setOrigin(0.5)
              .setDepth(4)
              .setActive(true);

            const targetY = Math.max(chest.y - 30 * scaleFactor, 0);
            scene.tweens.add({
              targets: plusText,
              y: targetY,
              alpha: 0,
              duration: 1000,
              onComplete: () => plusText.destroy(),
            });

            return newScore;
          });
        });

        chest.destroy();
        rings.forEach((ring) => ring.destroy());

        const index = chestData.indexOf(chestEntry);
        if (index !== -1) {
          chestData[index].chest = null;
          chestData[index].rings = [];
        }

        const currentTime = Date.now();
        const chestToSave: ChestData = {
          x,
          y,
          id,
          lastSpawnTime: currentTime,
          userId: telegramUserId,
        };
        await saveChestData(chestToSave);

        const respawnTime = 1 * 30 * 1000;
        setTimeout(() => {
          if (currentScene) {
            spawnChest(currentScene, x, y, scaleFactor, id);
          }
        }, respawnTime);
      });
    }

    function update(this: Phaser.Scene) {
      const visibleCount = chestData.filter(
        (entry) => entry.chest?.visible && entry.chest?.active
      ).length;
      if (lastVisibleCount !== visibleCount) {
        console.log("Visible chests in update:", visibleCount);
        lastVisibleCount = visibleCount;
      }
    }

    if (!gameInstance.current) {
      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
        chestData.forEach((entry) => {
          entry.chest?.destroy();
          entry.rings.forEach((ring) => ring.destroy());
        });
        currentScene = null;
      }
    };
  }, [currentRank]);

  return (
    <>
      <div className="text">
        {currentRank.title}, Until the next rank is left:
      </div>
      <ProgressBar balance={balance} currentRank={currentRank} ranks={ranks} />
      <div ref={gameRef} className="game-container" />
    </>
  );
}

export default Game;
