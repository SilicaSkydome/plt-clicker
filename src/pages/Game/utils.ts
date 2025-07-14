import Phaser from "phaser";
import { Rank, ChestData } from "../../Interfaces";
import { AppDispatch } from "../../store";
import { saveChestData } from "./useChests";
import { chestTextures, ringTextures } from "./config";
import { saveGameData } from "../../store/userSlice";

export function handleBoatClick(
  boatRef: Phaser.GameObjects.Image,
  currentSceneRef: Phaser.Scene,
  energyRef: React.MutableRefObject<number>,
  lastEnergyUpdateRef: React.MutableRefObject<number>,
  syncDisplayEnergy: () => void,
  setClickQueue: React.Dispatch<
    React.SetStateAction<
      { type: string; points: number; energyAtClick: number }[]
    >
  >,
  currentRank: Rank,
  dispatch: AppDispatch,
  scaleFactor: number
) {
  if (!boatRef || !currentSceneRef) return;

  boatRef.on(
    "pointerdown",
    async (
      pointer: Phaser.Input.Pointer,
      localX: number,
      localY: number,
      //@ts-ignore
      event: Phaser.Input.EventData
    ) => {
      event.stopPropagation();

      if (energyRef.current <= 0) {
        const warningText = currentSceneRef.add
          .text(boatRef.x, boatRef.y, "Not enough energy!", {
            fontSize: `${16 * scaleFactor}px`,
            color: "#ff0000",
          })
          .setOrigin(0.5)
          .setDepth(4);

        currentSceneRef.tweens.add({
          targets: warningText,
          y: boatRef.y - 30 * scaleFactor,
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
      await dispatch({
        type: "game/updateEnergy",
        payload: { energy: energyRef.current, time: currentTime },
      });
      await dispatch({ type: "game/incrementBalance", payload: points });
      await dispatch({ type: "user/saveGameData" }); // Сохраняем сразу

      setClickQueue((prev) => [
        ...prev,
        { type: "boat", points, energyAtClick },
      ]);

      console.log(
        "Boat clicked, points added:",
        points,
        "energy:",
        energyRef.current
      );
    }
  );
}

export function handleChestClick(
  chestSprite: Phaser.GameObjects.Image,
  chestData: ChestData,
  currentSceneRef: Phaser.Scene,
  setClickQueue: React.Dispatch<
    React.SetStateAction<
      { type: string; points: number; energyAtClick: number }[]
    >
  >,
  dispatch: AppDispatch,
  scaleFactor: number,
  rings: Phaser.GameObjects.Sprite[],
  chestDataRef: React.MutableRefObject<
    Array<{
      chest: Phaser.GameObjects.Image | null;
      rings: Phaser.GameObjects.Image[];
      x: number;
      y: number;
      id: number;
    }>
  >
) {
  chestSprite.on("pointerdown", async (pointer: Phaser.Input.Pointer) => {
    const points = Math.floor(Math.random() * (10 - 3 + 1)) + 3;

    // Add visual feedback
    const plusText = currentSceneRef.add
      .text(chestSprite.x, chestSprite.y, `+${points}`, {
        fontSize: `${16 * scaleFactor}px`,
        color: "#ffd700",
      })
      .setOrigin(0.5)
      .setDepth(4);

    currentSceneRef.tweens.add({
      targets: plusText,
      y: chestSprite.y - 30 * scaleFactor,
      alpha: 0,
      duration: 1000,
      onComplete: () => plusText.destroy(),
    });

    await dispatch({ type: "game/incrementBalance", payload: points });
    await dispatch({ type: "user/saveGameData" }); // Сохраняем сразу

    const currentTime = Date.now();
    const updatedChest: ChestData = {
      ...chestData,
      x: chestSprite.x,
      y: chestSprite.y,
      lastSpawnTime: currentTime,
    };
    saveChestData(updatedChest);

    const chestIndex = chestDataRef.current.findIndex(
      (c) => c.chest === chestSprite
    );
    if (chestIndex !== -1) {
      chestDataRef.current[chestIndex].chest = null;
      chestDataRef.current[chestIndex].rings = [];
    }
    chestSprite.destroy();
    rings.forEach((ring) => ring.destroy());

    // Schedule respawn with rings
    currentSceneRef.time.addEvent({
      delay: 30000,
      callback: () => {
        if (currentSceneRef.scene.isActive()) {
          const newChest = currentSceneRef.add
            .image(updatedChest.x, updatedChest.y, chestTextures.commonChest)
            .setInteractive({ useHandCursor: true })
            .setDepth(3)
            .setScale(0.05 * scaleFactor);

          const newRings: Phaser.GameObjects.Sprite[] = [];
          Object.values(ringTextures).forEach((key, index) => {
            const ring = currentSceneRef.add
              .sprite(updatedChest.x, updatedChest.y, key)
              .setDepth(0)
              .setScale(0);

            const ringTexture = currentSceneRef.textures
              .get(key)
              .getSourceImage() as HTMLImageElement;
            const ringOriginalWidth = ringTexture.width;
            const desiredRingWidth =
              currentSceneRef.scale.width * (0.3 + index * 0.07);
            const ringScale = desiredRingWidth / ringOriginalWidth;
            const minRingScale = 0.2 + index * 0.07;
            const maxRingScale = ringScale;

            currentSceneRef.tweens.add({
              targets: ring,
              scale: { from: minRingScale, to: maxRingScale },
              duration: 3000,
              delay: index * 500,
              ease: "Sine.easeInOut",
              repeat: -1,
              yoyo: true,
            });

            currentSceneRef.tweens.add({
              targets: ring,
              alpha: { from: 0.4, to: 1 },
              duration: 3000,
              delay: index * 500,
              ease: "Sine.easeInOut",
              repeat: -1,
              yoyo: true,
            });

            newRings.push(ring);
          });

          const chestEntry = {
            chest: newChest,
            rings: newRings,
            x: updatedChest.x,
            y: updatedChest.y,
            id: chestData.id,
          };
          chestDataRef.current.push(chestEntry);

          handleChestClick(
            newChest,
            { ...updatedChest, lastSpawnTime: null },
            currentSceneRef,
            setClickQueue,
            dispatch,
            scaleFactor,
            newRings,
            chestDataRef
          );
        }
      },
    });
  });
}

export function processClickQueue(
  clickQueue: { type: string; points: number; energyAtClick: number }[],
  setClickQueue: React.Dispatch<
    React.SetStateAction<
      { type: string; points: number; energyAtClick: number }[]
    >
  >,
  isTestMode: boolean,
  dispatch: AppDispatch
) {
  if (clickQueue.length === 0) return;

  if (isTestMode) {
    console.log("Test mode: Clearing clickQueue", clickQueue);
    setClickQueue([]);
    return;
  }

  console.log("Processing clickQueue:", clickQueue);
  console.log(
    "Total points to save:",
    clickQueue.reduce((sum, click) => sum + click.points, 0)
  );
  // Не вызываем saveGameData, так как оно уже вызывается в handleBoatClick и handleChestClick
  setClickQueue([]);
  dispatch(saveGameData())
    .then(() => {
      console.log("Game data saved successfully after processing clickQueue");
    })
    .catch((error) => {
      console.error(
        "Error saving game data after processing clickQueue:",
        error
      );
    });
}
