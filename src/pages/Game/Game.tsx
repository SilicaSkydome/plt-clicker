import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import Cookies from "js-cookie";
import chest from "../../assets/img/chestPlaceholder.webp";
import ring1 from "../../assets/img/circles/1.png";
import ring2 from "../../assets/img/circles/2.png";
import ring3 from "../../assets/img/circles/3.png";
import shipPlaceholder from "../../assets/img/ship.webp";
import "./Game.css";
import EnergyBar from "../../components/Common/EnergyBar/EnergyBar";
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
import { Rank, UserData } from "../../Interfaces";

interface GameProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  currentRank: Rank;
  ranks: Rank[];
  initialEnergy: number;
  initialLastEnergyUpdate: number;
  saveEnergy: (newEnergy: number, updateTime: number) => Promise<void>;
  maxEnergy: number;
}

interface ChestData {
  x: number;
  y: number;
  id: number;
  lastSpawnTime: number | null;
  userId: string;
}

interface ClickEvent {
  type: "boat" | "chest";
  points: number;
  chestId?: number;
  energyAtClick?: number;
}

function Game({
  balance,
  setBalance,
  currentRank,
  ranks,
  initialEnergy,
  initialLastEnergyUpdate,
  saveEnergy,
  maxEnergy,
}: GameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [clickQueue, setClickQueue] = useState<ClickEvent[]>([]);
  const energyRef = useRef<number>(initialEnergy);
  const lastEnergyUpdateRef = useRef<number>(initialLastEnergyUpdate);
  const [displayEnergy, setDisplayEnergy] = useState<number>(initialEnergy);
  const telegramUserId =
    // @ts-ignore
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() || "default";
  const saveQueueRef = useRef<ChestData[]>([]);
  const isSavingRef = useRef(false);
  const energySaveQueueRef = useRef<{ energy: number; updateTime: number }[]>(
    []
  );
  const isSavingEnergyRef = useRef(false);

  const syncDisplayEnergy = () => {
    setDisplayEnergy(energyRef.current);
  };

  // Save energy to cookies
  const saveEnergyToCookies = (energy: number, updateTime: number) => {
    try {
      Cookies.set(
        `energy_${telegramUserId}`,
        JSON.stringify({ energy, lastEnergyUpdate: updateTime }),
        { expires: 7 }
      );
      console.log(`Energy ${energy} saved to cookies with time ${updateTime}`);
    } catch (error) {
      console.error("Error saving energy to cookies:", error);
    }
  };

  // Load energy from cookies
  const loadEnergyFromCookies = () => {
    try {
      const cookieData = Cookies.get(`energy_${telegramUserId}`);
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        if (
          parsed.energy !== undefined &&
          parsed.lastEnergyUpdate !== undefined
        ) {
          console.log("Loaded from cookies:", parsed);
          return {
            energy: parsed.energy,
            lastEnergyUpdate: parsed.lastEnergyUpdate,
          };
        }
      }
    } catch (error) {
      console.error("Error loading energy from cookies:", error);
    }
    return null;
  };

  // Save energy with queue
  const saveEnergyWithQueue = async (energy: number, updateTime: number) => {
    saveEnergyToCookies(energy, updateTime);
    energySaveQueueRef.current.push({ energy, updateTime });
    console.log(
      `Energy queued for Firestore: ${energy}, time: ${updateTime}. Queue length: ${energySaveQueueRef.current.length}`
    );

    if (isSavingEnergyRef.current) return;

    isSavingEnergyRef.current = true;
    while (energySaveQueueRef.current.length > 0) {
      const { energy, updateTime } = energySaveQueueRef.current[0];
      try {
        await saveEnergy(energy, updateTime);
        console.log(
          `Energy ${energy} saved to Firestore with time ${updateTime}`
        );
      } catch (error) {
        console.error(`Error saving energy ${energy} to Firestore:`, error);
      }
      energySaveQueueRef.current.shift();
    }
    isSavingEnergyRef.current = false;
  };

  // Sync energy on mount
  useEffect(() => {
    const syncEnergyOnMount = async () => {
      let newEnergy = initialEnergy;
      let newLastEnergyUpdate = initialLastEnergyUpdate;

      // Try cookies first
      const cookieData = loadEnergyFromCookies();
      if (cookieData) {
        newEnergy = cookieData.energy;
        newLastEnergyUpdate = cookieData.lastEnergyUpdate;
      }

      // Then try Firestore
      if (telegramUserId !== "default") {
        try {
          const userDocRef = doc(db, "userData", telegramUserId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            const storedEnergy = userData.energy ?? newEnergy;
            const storedLastUpdate =
              userData.lastEnergyUpdate ?? newLastEnergyUpdate;
            console.log("Loaded from Firestore:", {
              storedEnergy,
              storedLastUpdate,
            });

            if (storedLastUpdate > newLastEnergyUpdate) {
              newEnergy = storedEnergy;
              newLastEnergyUpdate = storedLastUpdate;
            }
          }
        } catch (error) {
          console.error("Error loading energy from Firestore:", error);
        }
      }

      // Calculate energy recovery
      const currentTime = Date.now();
      const timeElapsed = (currentTime - newLastEnergyUpdate) / 1000;
      const energyToAdd = Math.floor(timeElapsed / 30);
      newEnergy = Math.min(newEnergy + energyToAdd, maxEnergy);

      energyRef.current = newEnergy;
      lastEnergyUpdateRef.current = currentTime;
      syncDisplayEnergy();
      await saveEnergyWithQueue(newEnergy, currentTime);

      console.log("Energy synced on mount:", { newEnergy, currentTime });
    };

    syncEnergyOnMount();
  }, [initialEnergy, initialLastEnergyUpdate, telegramUserId, maxEnergy]);

  // Sync energy on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        telegramUserId !== "default"
      ) {
        console.log("Tab visible, syncing energy from Firestore");
        try {
          const userDocRef = doc(db, "userData", telegramUserId);
          const userDoc = await getDoc(userDocRef);
          let newEnergy = energyRef.current;
          let newLastEnergyUpdate = lastEnergyUpdateRef.current;

          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            const storedEnergy = userData.energy ?? newEnergy;
            const storedLastUpdate =
              userData.lastEnergyUpdate ?? newLastEnergyUpdate;
            console.log("Loaded from Firestore:", {
              storedEnergy,
              storedLastUpdate,
            });

            if (storedLastUpdate > newLastEnergyUpdate) {
              newEnergy = storedEnergy;
              newLastEnergyUpdate = storedLastUpdate;
            }
          }

          const currentTime = Date.now();
          const timeElapsed = (currentTime - newLastEnergyUpdate) / 1000;
          const energyToAdd = Math.floor(timeElapsed / 30);
          newEnergy = Math.min(newEnergy + energyToAdd, maxEnergy);

          energyRef.current = newEnergy;
          lastEnergyUpdateRef.current = currentTime;
          syncDisplayEnergy();
          await saveEnergyWithQueue(newEnergy, currentTime);

          console.log("Energy synced on visibility change:", {
            newEnergy,
            currentTime,
          });
        } catch (error) {
          console.error("Error syncing energy on visibility change:", error);
          const cookieData = loadEnergyFromCookies();
          if (cookieData) {
            const currentTime = Date.now();
            const timeElapsed =
              (currentTime - cookieData.lastEnergyUpdate) / 1000;
            const energyToAdd = Math.floor(timeElapsed / 30);
            const newEnergy = Math.min(
              cookieData.energy + energyToAdd,
              maxEnergy
            );

            energyRef.current = newEnergy;
            lastEnergyUpdateRef.current = currentTime;
            syncDisplayEnergy();
            await saveEnergyWithQueue(newEnergy, currentTime);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [telegramUserId, maxEnergy]);

  // Energy recovery
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startEnergyRecovery = () => {
      intervalId = setInterval(() => {
        if (document.visibilityState === "hidden") {
          console.log("Tab hidden, pausing energy recovery");
          return;
        }

        const currentTime = Date.now();
        const timeElapsed = (currentTime - lastEnergyUpdateRef.current) / 1000;
        const energyToAdd = Math.floor(timeElapsed / 30);

        if (energyToAdd > 0) {
          energyRef.current = Math.min(
            energyRef.current + energyToAdd,
            maxEnergy
          );
          lastEnergyUpdateRef.current = currentTime;
          console.log("Energy recovered:", {
            current: energyRef.current,
            energyToAdd,
          });
          syncDisplayEnergy();
          saveEnergyWithQueue(energyRef.current, currentTime);
        }
      }, 1000);
    };

    startEnergyRecovery();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [maxEnergy]);

  // Save chest data
  const saveChestData = async (chest: ChestData) => {
    saveQueueRef.current.push(chest);
    console.log(
      `Chest ${chest.id} queued for save. Queue length: ${saveQueueRef.current.length}`
    );

    if (isSavingRef.current) return;

    isSavingRef.current = true;
    while (saveQueueRef.current.length > 0) {
      const nextChest = saveQueueRef.current[0];
      try {
        const chestDocRef = doc(
          db,
          "chests",
          `${telegramUserId}_${nextChest.id}`
        );
        await setDoc(chestDocRef, nextChest);
        console.log(`Chest ${nextChest.id} saved to Firestore`);
      } catch (error) {
        console.error(`Error saving chest ${nextChest.id}:`, error);
      }
      saveQueueRef.current.shift();
    }
    isSavingRef.current = false;
  };

  // Process click queue
  useEffect(() => {
    if (clickQueue.length === 0) return;

    const processClick = (click: ClickEvent) => {
      if (click.type === "boat" && (click.energyAtClick ?? 0) < 1) {
        console.log("Skipped boat click: insufficient energy at click");
        return;
      }

      setBalance((prev) => {
        const newBalance = parseFloat((prev + click.points).toFixed(2));
        console.log(
          `Balance updated (${click.type}${
            click.chestId !== undefined ? `, chest ${click.chestId}` : ""
          }): ${prev} + ${click.points} = ${newBalance}`
        );
        return newBalance;
      });
    };

    clickQueue.forEach((click) => processClick(click));
    setClickQueue([]);
  }, [clickQueue, setBalance]);

  // Phaser game setup
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
      input: {
        activePointers: 3,
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

    function preload(this: Phaser.Scene) {
      this.load.image("chest", chest);
      this.load.image("ring1", ring1);
      this.load.image("ring2", ring2);
      this.load.image("ring3", ring3);
      this.load.image("boat", shipPlaceholder);
    }

    function create(this: Phaser.Scene) {
      currentScene = this;
      this.input.setPollAlways();

      const boat = this.add
        .image(baseWidth / 2, baseHeight / 2, "boat")
        .setInteractive({ useHandCursor: true, pixelPerfect: true })
        .setDepth(2) as Phaser.GameObjects.Image;

      const boatTexture = this.textures
        .get("boat")
        .getSourceImage() as HTMLImageElement;
      const boatOriginalWidth = boatTexture.width;
      const desiredBoatWidth = baseWidth * 0.25;
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
        console.log("Boat clicked, current energy:", energyRef.current);

        if (energyRef.current <= 0) {
          console.log("Insufficient energy for click");
          const warningText = currentScene!.add
            .text(boat.x, boat.y, "Not enough energy!", {
              fontSize: `${16 * scaleFactor}px`,
              color: "#ff0000",
            })
            .setOrigin(0.5)
            .setDepth(4);
          currentScene!.tweens.add({
            targets: warningText,
            y: boat.y - 30 * scaleFactor,
            alpha: 0,
            duration: 1000,
            onComplete: () => warningText.destroy(),
          });
          return;
        }

        console.log("Boat click registered");
        const basePoints = 0.1;
        const points = basePoints + currentRank.clickBonus;

        const energyAtClick = energyRef.current;
        energyRef.current = Math.max(energyRef.current - 1, 0);
        const currentTime = Date.now();
        lastEnergyUpdateRef.current = currentTime;

        console.log("Energy after click:", energyRef.current);

        syncDisplayEnergy();
        saveEnergyWithQueue(energyRef.current, currentTime);

        setClickQueue((prev) => [
          ...prev,
          { type: "boat", points, energyAtClick },
        ]);

        const baseFontSize = 16;
        const fontSize = baseFontSize * scaleFactor;
        const plusText = currentScene!.add
          .text(boat.x, boat.y, `+${points.toFixed(2)}`, {
            fontSize: `${fontSize}px`,
            color: "#ffd700",
          })
          .setOrigin(0.5)
          .setDepth(4)
          .setActive(true);

        const targetY = Math.max(boat.y - 30 * scaleFactor, 0);
        currentScene!.tweens.add({
          targets: plusText,
          y: targetY,
          alpha: 0,
          duration: 1000,
          onComplete: () => plusText.destroy(),
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
              y = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
              attempts++;
            } while (
              isOverlapping(x, y, savedChests, boat, 50 * scaleFactor) &&
              attempts < maxAttempts
            );

            if (attempts >= maxAttempts) {
              console.warn(
                `Could not find a valid position for chest ${index} after max attempts.`
              );
              return;
            }

            savedChests[index].x = x;
            savedChests[index].y = y;
            saveChestData(savedChests[index]);
          } else {
            x = chest.x;
            y = chest.y;
            if (y < baseHeight / 2) {
              let attempts = 0;
              const maxAttempts = 10;
              do {
                x = Phaser.Math.Between(50, baseWidth - 50);
                y = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
                attempts++;
              } while (
                isOverlapping(x, y, savedChests, boat, 50 * scaleFactor) &&
                attempts < maxAttempts
              );
              if (attempts < maxAttempts) {
                savedChests[index].x = x;
                savedChests[index].y = y;
                saveChestData(savedChests[index]);
              } else {
                console.warn(
                  `Could not reposition chest ${index} after max attempts.`
                );
              }
            }
          }

          console.log(`Chest ${index} spawned at x: ${x}, y: ${y}`);
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
        if (distance < minDistance && (chest.x !== x || chest.y !== y))
          return true;
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
      const respawnInterval = 30 * 1000;

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
        .setInteractive({ useHandCursor: true, pixelPerfect: true })
        .setScale(0)
        .setDepth(3)
        .setActive(true) as Phaser.GameObjects.Sprite;

      const finalChestScale = 0.04 * scaleFactor;

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
        const desiredRingWidth = baseWidth * (0.3 + index * 0.07);
        const ringScale = desiredRingWidth / ringOriginalWidth;
        const minRingScale = 0.2 + index * 0.07;
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

      scene.tweens.add({
        targets: chest,
        scale: finalChestScale,
        duration: 500,
        ease: "Bounce.easeOut",
        onComplete: () => {
          console.log(`Chest ${id} scale after tween: ${chest.scale}`);
        },
      });

      const chestEntry = { chest, rings, x, y, id };
      chestData.push(chestEntry);

      chest.on("pointerdown", () => {
        console.log(`Chest ${id} clicked`);
        const basePoints = Phaser.Math.Between(3, 10);
        const points = basePoints + currentRank.clickBonus;
        setClickQueue((prev) => [
          ...prev,
          { type: "chest", points, chestId: id },
        ]);

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
        saveChestData(chestToSave);

        const respawnTime = 30 * 1000;
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
        console.log(`Visible chests in update: ${visibleCount}`);
        lastVisibleCount = visibleCount;
      }
    }

    if (!gameInstance.current) {
      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      const currentTime = Date.now();
      saveEnergyToCookies(energyRef.current, currentTime);
      saveEnergyWithQueue(energyRef.current, currentTime).then(() => {
        console.log("Energy saved to Firestore before unmount");
      });

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
  }, [currentRank, initialEnergy, initialLastEnergyUpdate, telegramUserId]);

  return (
    <>
      <div ref={gameRef} className="game-container" />
      <EnergyBar currentEnergy={displayEnergy} maxEnergy={maxEnergy} />
    </>
  );
}

export default Game;
