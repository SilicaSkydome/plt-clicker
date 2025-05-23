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
import Header from "../../components/Header/Header";

interface GameProps {
  user: UserData;
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
  user,
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
  const boatRef = useRef<Phaser.GameObjects.Image | null>(null);
  const currentSceneRef = useRef<Phaser.Scene | null>(null);
  const chestDataRef = useRef<
    Array<{
      chest: Phaser.GameObjects.Sprite | null;
      rings: Phaser.GameObjects.Sprite[];
      x: number;
      y: number;
      id: number;
    }>
  >([]);
  const [baseWidth, setBaseWidth] = useState(window.innerWidth);
  const [baseHeight, setBaseHeight] = useState(window.innerHeight - 100);
  const [scaleFactor, setScaleFactor] = useState(() => {
    const gameWidth = window.innerWidth;
    const referenceWidth = 360;
    return gameWidth / referenceWidth;
  });

  const syncDisplayEnergy = () => {
    setDisplayEnergy(energyRef.current);
  };

  const saveEnergyToCookies = (energy: number, updateTime: number) => {
    try {
      Cookies.set(
        `energy_${telegramUserId}`,
        JSON.stringify({ energy, lastEnergyUpdate: updateTime }),
        { expires: 7 }
      );
    } catch (error) {
      console.error("Error saving energy to cookies:", error);
    }
  };

  const loadEnergyFromCookies = () => {
    try {
      const cookieData = Cookies.get(`energy_${telegramUserId}`);
      if (cookieData) {
        const parsed = JSON.parse(cookieData);
        if (
          parsed.energy !== undefined &&
          parsed.lastEnergyUpdate !== undefined
        ) {
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

  const saveEnergyWithQueue = async (energy: number, updateTime: number) => {
    saveEnergyToCookies(energy, updateTime);
    energySaveQueueRef.current.push({ energy, updateTime });

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

  useEffect(() => {
    const syncEnergyOnMount = async () => {
      let newEnergy = initialEnergy;
      let newLastEnergyUpdate = initialLastEnergyUpdate;

      const cookieData = loadEnergyFromCookies();
      if (cookieData) {
        newEnergy = cookieData.energy;
        newLastEnergyUpdate = cookieData.lastEnergyUpdate;
      }

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

      const currentTime = Date.now();
      const timeElapsed = (currentTime - newLastEnergyUpdate) / 1000;
      const energyToAdd = Math.floor(timeElapsed / 30);
      newEnergy = Math.min(newEnergy + energyToAdd, maxEnergy);

      energyRef.current = newEnergy;
      lastEnergyUpdateRef.current = currentTime;
      syncDisplayEnergy();
      await saveEnergyWithQueue(newEnergy, currentTime);
    };

    syncEnergyOnMount();
  }, [initialEnergy, initialLastEnergyUpdate, telegramUserId, maxEnergy]);

  const isOverlapping = (
    x: number,
    y: number,
    existingChests: Array<{ x: number; y: number }>,
    boat: Phaser.GameObjects.Image | null,
    minDistance: number
  ): boolean => {
    if (!boat) return false;
    const boatDistance = Phaser.Math.Distance.Between(x, y, boat.x, boat.y);
    if (boatDistance < minDistance * 2) return true;

    for (const chest of existingChests) {
      const distance = Phaser.Math.Distance.Between(x, y, chest.x, chest.y);
      if (distance < minDistance && (chest.x !== x || chest.y !== y))
        return true;
    }
    return false;
  };

  const saveChestData = async (chest: ChestData) => {
    if (user.id === "test_user_123") {
      return;
    }

    saveQueueRef.current.push(chest);

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
      } catch (error) {}
      saveQueueRef.current.shift();
    }
    isSavingRef.current = false;
  };

  const loadChestData = async (attempts = 3): Promise<ChestData[]> => {
    for (let i = 0; i < attempts; i++) {
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
        console.error(`Attempt ${i + 1} failed to load chest data:`, error);
      }
    }
    console.warn("Failed to load chests, using defaults");
    return [
      { x: 0, y: 0, id: 0, lastSpawnTime: null, userId: telegramUserId },
      { x: 0, y: 0, id: 1, lastSpawnTime: null, userId: telegramUserId },
      { x: 0, y: 0, id: 2, lastSpawnTime: null, userId: telegramUserId },
    ];
  };

  const spawnChest = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    scaleFactor: number,
    id: number
  ) => {
    console.log(
      `Spawning chest ${id} at x: ${x}, y: ${y}, scale: ${scaleFactor}`
    );
    const chest = scene.add
      .sprite(x, y, "chest")
      .setInteractive({ useHandCursor: true, pixelPerfect: true })
      .setScale(0)
      .setDepth(3)
      .setActive(true) as Phaser.GameObjects.Sprite;

    console.log(
      `Chest ${id} created, visible: ${chest.visible}, active: ${chest.active}`
    );

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
    const existingIndex = chestDataRef.current.findIndex(
      (entry) => entry.id === id
    );
    if (existingIndex !== -1) {
      chestDataRef.current[existingIndex] = chestEntry;
    } else {
      chestDataRef.current.push(chestEntry);
    }

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

      const index = chestDataRef.current.findIndex((entry) => entry.id === id);
      if (index !== -1) {
        chestDataRef.current[index].chest = null;
        chestDataRef.current[index].rings = [];
      }

      const currentTime = Date.now();
      const chestToSave: ChestData = {
        x: 0,
        y: 0,
        id,
        lastSpawnTime: currentTime,
        userId: telegramUserId,
      };
      saveChestData(chestToSave);

      const respawnTime = 30 * 1000;
      scene.time.addEvent({
        delay: respawnTime,
        callback: () => {
          console.log(`Scheduled respawn for chest ${id}`);
          let newX, newY;
          let attempts = 0;
          const maxAttempts = 10;

          do {
            newX = Phaser.Math.Between(50, baseWidth - 50);
            newY = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
            attempts++;
          } while (
            isOverlapping(
              newX,
              newY,
              chestDataRef.current.map((entry) => ({ x: entry.x, y: entry.y })),
              boatRef.current,
              30 * scaleFactor
            ) &&
            attempts < maxAttempts
          );

          if (attempts >= maxAttempts) {
            console.warn(
              `Could not find a valid position for chest ${id} after max attempts.`
            );
            return;
          }

          newX = Phaser.Math.Clamp(newX, 50, baseWidth - 50);
          newY = Phaser.Math.Clamp(newY, baseHeight / 2 + 50, baseHeight - 50);

          const updatedChest = {
            x: newX,
            y: newY,
            id,
            lastSpawnTime: null,
            userId: telegramUserId,
          };
          saveChestData(updatedChest);

          spawnChest(scene, newX, newY, scaleFactor, id);
        },
        callbackScope: scene,
      });
    });
  };

  const initializeChest = (
    scene: Phaser.Scene,
    x: number,
    y: number,
    scaleFactor: number,
    id: number,
    lastSpawnTime: number | null
  ) => {
    console.log(
      `Initializing chest ${id} at x: ${x}, y: ${y}, lastSpawnTime: ${lastSpawnTime}`
    );
    const currentTime = Date.now();
    const respawnInterval = 30 * 1000;

    if (!lastSpawnTime || currentTime - lastSpawnTime >= respawnInterval) {
      spawnChest(scene, x, y, scaleFactor, id);
    } else {
      const timeLeft = respawnInterval - (currentTime - lastSpawnTime);
      console.log(`Chest ${id} will respawn in ${timeLeft / 1000} seconds`);
      scene.time.addEvent({
        delay: timeLeft,
        callback: () => {
          console.log(`Respawning chest ${id} after delay`);
          let newX, newY;
          let attempts = 0;
          const maxAttempts = 10;

          do {
            newX = Phaser.Math.Between(50, baseWidth - 50);
            newY = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
            attempts++;
          } while (
            isOverlapping(
              newX,
              newY,
              chestDataRef.current.map((entry) => ({ x: entry.x, y: entry.y })),
              boatRef.current,
              30 * scaleFactor
            ) &&
            attempts < maxAttempts
          );

          if (attempts >= maxAttempts) {
            console.warn(
              `Could not find a valid position for chest ${id} after max attempts.`
            );
            return;
          }

          newX = Phaser.Math.Clamp(newX, 50, baseWidth - 50);
          newY = Phaser.Math.Clamp(newY, baseHeight / 2 + 50, baseHeight - 50);

          const updatedChest = {
            x: newX,
            y: newY,
            id,
            lastSpawnTime: null,
            userId: telegramUserId,
          };
          saveChestData(updatedChest);

          spawnChest(scene, newX, newY, scaleFactor, id);
        },
        callbackScope: scene,
      });
    }
  };

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        telegramUserId !== "default" &&
        currentSceneRef.current
      ) {
        console.log("Tab visible, syncing energy and chests from Firestore");
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

          const savedChests = await loadChestData();
          savedChests.forEach((chest: ChestData) => {
            const existing = chestDataRef.current.find(
              (entry) => entry.id === chest.id
            );
            if (!existing || !existing.chest?.active) {
              let newX, newY;
              let attempts = 0;
              const maxAttempts = 10;

              do {
                newX = Phaser.Math.Between(50, baseWidth - 50);
                newY = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
                attempts++;
              } while (
                isOverlapping(
                  newX,
                  newY,
                  savedChests,
                  boatRef.current,
                  30 * scaleFactor
                ) &&
                attempts < maxAttempts
              );

              if (attempts >= maxAttempts) {
                console.warn(
                  `Could not find a valid position for chest ${chest.id} after max attempts.`
                );
                return;
              }

              newX = Phaser.Math.Clamp(newX, 50, baseWidth - 50);
              newY = Phaser.Math.Clamp(
                newY,
                baseHeight / 2 + 50,
                baseHeight - 50
              );

              const updatedChest = { ...chest, x: newX, y: newY };
              saveChestData(updatedChest);

              initializeChest(
                currentSceneRef.current!,
                newX,
                newY,
                scaleFactor,
                chest.id,
                chest.lastSpawnTime
              );
            }
          });
        } catch (error) {
          console.error("Error syncing on visibility change:", error);
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
  }, [telegramUserId, maxEnergy, scaleFactor, baseWidth, baseHeight]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const startEnergyRecovery = () => {
      intervalId = setInterval(() => {
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

  useEffect(() => {
    if (clickQueue.length === 0) return;

    const processClick = (click: ClickEvent) => {
      if (click.type === "boat" && (click.energyAtClick ?? 0) < 1) {
        return;
      }

      setBalance((prev) => {
        const newBalance = parseFloat((prev + click.points).toFixed(2));
        return newBalance;
      });
    };

    clickQueue.forEach((click) => processClick(click));
    setClickQueue([]);
  }, [clickQueue, setBalance]);

  useEffect(() => {
    let gameWidth = window.innerWidth;
    let gameHeight = (window.innerHeight - 100) * (baseHeight / baseWidth);

    if (gameHeight > window.innerHeight - 100) {
      gameHeight = window.innerHeight - 100;
      gameWidth = gameHeight * (baseWidth / baseHeight);
    }

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

    let lastVisibleCount: number | null = null;

    function preload(this: Phaser.Scene) {
      this.load.image("chest", chest);
      this.load.image("ring1", ring1);
      this.load.image("ring2", ring2);
      this.load.image("ring3", ring3);
      this.load.image("boat", shipPlaceholder);
    }

    function create(this: Phaser.Scene) {
      currentSceneRef.current = this;
      this.input.setPollAlways();

      boatRef.current = this.add
        .image(baseWidth / 2, baseHeight / 2, "boat")
        .setInteractive({ useHandCursor: true, pixelPerfect: true })
        .setDepth(2) as Phaser.GameObjects.Image;

      const boatTexture = this.textures
        .get("boat")
        .getSourceImage() as HTMLImageElement;
      const boatOriginalWidth = boatTexture.width;
      const desiredBoatWidth = baseWidth * 0.25;
      const boatScale = desiredBoatWidth / boatOriginalWidth;
      boatRef.current.setScale(boatScale);

      this.tweens.add({
        targets: boatRef.current,
        y: baseHeight / 2 + 10 * scaleFactor,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      boatRef.current.on("pointerdown", () => {
        if (energyRef.current <= 0) {
          const warningText = currentSceneRef
            .current!.add.text(
              boatRef.current!.x,
              boatRef.current!.y,
              "Not enough energy!",
              {
                fontSize: `${16 * scaleFactor}px`,
                color: "#ff0000",
              }
            )
            .setOrigin(0.5)
            .setDepth(4);
          currentSceneRef.current!.tweens.add({
            targets: warningText,
            y: boatRef.current!.y - 30 * scaleFactor,
            alpha: 0,
            duration: 1000,
            onComplete: () => warningText.destroy(),
          });
          return;
        }

        const basePoints = 0.1;
        const points = basePoints + currentRank.clickBonus;

        const energyAtClick = energyRef.current;
        energyRef.current = Math.max(energyRef.current - 1, 0);
        const currentTime = Date.now();
        lastEnergyUpdateRef.current = currentTime;

        syncDisplayEnergy();
        saveEnergyWithQueue(energyRef.current, currentTime);

        setClickQueue((prev) => [
          ...prev,
          { type: "boat", points, energyAtClick },
        ]);

        const baseFontSize = 16;
        const fontSize = baseFontSize * scaleFactor;
        const plusText = currentSceneRef
          .current!.add.text(
            boatRef.current!.x,
            boatRef.current!.y,
            `+${points.toFixed(2)}`,
            {
              fontSize: `${fontSize}px`,
              color: "#ffd700",
            }
          )
          .setOrigin(0.5)
          .setDepth(4)
          .setActive(true);

        const targetY = Math.max(boatRef.current!.y - 30 * scaleFactor, 0);
        currentSceneRef.current!.tweens.add({
          targets: plusText,
          y: targetY,
          alpha: 0,
          duration: 1000,
          onComplete: () => plusText.destroy(),
        });
      });

      loadChestData().then((savedChests) => {
        savedChests.forEach((chest: ChestData, index) => {
          let x, y;
          let attempts = 0;
          const maxAttempts = 10;

          do {
            x = Phaser.Math.Between(50, baseWidth - 50);
            y = Phaser.Math.Between(baseHeight / 2, baseHeight - 100);
            attempts++;
          } while (
            isOverlapping(
              x,
              y,
              savedChests,
              boatRef.current,
              30 * scaleFactor
            ) &&
            attempts < maxAttempts
          );

          if (attempts >= maxAttempts) {
            return;
          }

          x = Phaser.Math.Clamp(x, 50, baseWidth - 50);
          y = Phaser.Math.Clamp(y, baseHeight / 2 + 50, baseHeight - 50);

          savedChests[index].x = x;
          savedChests[index].y = y;
          saveChestData(savedChests[index]);

          initializeChest(this, x, y, scaleFactor, index, chest.lastSpawnTime);
        });
      });
    }

    function update(this: Phaser.Scene) {
      const visibleCount = chestDataRef.current.filter(
        (entry) => entry.chest?.visible && entry.chest?.active
      ).length;
      if (lastVisibleCount !== visibleCount) {
        lastVisibleCount = visibleCount;
      }
    }

    if (!gameInstance.current) {
      gameInstance.current = new Phaser.Game(config);
    }

    const handleResize = () => {
      const newBaseWidth = window.innerWidth;
      const newBaseHeight = window.innerHeight - 100;
      let newGameWidth = newBaseWidth;
      let newGameHeight = newBaseHeight;

      const aspectRatio = newBaseHeight / newBaseWidth;
      if (newGameHeight > window.innerHeight - 100) {
        newGameHeight = window.innerHeight - 100;
        newGameWidth = newGameHeight / aspectRatio;
      }

      const referenceWidth = 360;
      const newScaleFactor = newGameWidth / referenceWidth;

      setBaseWidth(newBaseWidth);
      setBaseHeight(newBaseHeight);
      setScaleFactor(newScaleFactor);

      if (gameInstance.current && boatRef.current) {
        gameInstance.current.scale.resize(newBaseWidth, newBaseHeight);
        boatRef.current.setPosition(newBaseWidth / 2, newBaseHeight / 2);
        chestDataRef.current.forEach((entry) => {
          if (entry.chest?.active) {
            let newX = Phaser.Math.Clamp(entry.x, 50, newBaseWidth - 50);
            let newY = Phaser.Math.Clamp(entry.y, 50, newBaseHeight - 100);
            entry.chest.setPosition(newX, newY);
            entry.rings.forEach((ring) => ring.setPosition(newX, newY));
            entry.x = newX;
            entry.y = newY;
            saveChestData({
              x: newX,
              y: newY,
              id: entry.id,
              lastSpawnTime: entry.chest ? null : Date.now(),
              userId: telegramUserId,
            });
          }
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      const currentTime = Date.now();
      saveEnergyToCookies(energyRef.current, currentTime);
      saveEnergyWithQueue(energyRef.current, currentTime);

      window.removeEventListener("resize", handleResize);

      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
        chestDataRef.current.forEach((entry) => {
          entry.chest?.destroy();
          entry.rings.forEach((ring) => ring.destroy());
        });
        currentSceneRef.current = null;
        boatRef.current = null;
      }
    };
  }, [currentRank, initialEnergy, initialLastEnergyUpdate, telegramUserId]);

  return (
    <>
      <Header balance={balance} user={user} ranks={ranks} />
      <div ref={gameRef} className="game-container" />
      <EnergyBar currentEnergy={displayEnergy} maxEnergy={maxEnergy} />
    </>
  );
}

export default Game;
