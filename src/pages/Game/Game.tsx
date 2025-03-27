import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import React from "react";
import chestPlaceholder from "../../assets/img/chestPlaceholder.webp";
import shipPlaceholder from "../../assets/img/shipPlaceholder.png";
import "./Game.css";

type GameProps = {
  setBalance: (value: number) => void;
};

function Game({ setBalance }: GameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const gameInstance = useRef<Phaser.Game | null>(null);
  const [score, setScore] = useState(0);

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
      chest: Phaser.GameObjects.Sprite;
      wave: Phaser.GameObjects.Graphics;
      x: number;
      y: number;
    }> = [];
    let lastVisibleCount: number | null = null;

    function preload(this: Phaser.Scene) {
      this.load.image("chest", chestPlaceholder);
      this.load.image("boat", shipPlaceholder);
    }

    function create(this: Phaser.Scene) {
      currentScene = this;

      // Корабль
      const boat = this.add
        .image(baseWidth / 2, baseHeight / 2, "boat")
        .setDepth(2) as Phaser.GameObjects.Image;

      const boatTexture = this.textures
        .get("boat")
        .getSourceImage() as HTMLImageElement;
      const boatOriginalWidth = boatTexture.width;
      const desiredBoatWidth = baseWidth * 0.5;
      const boatScale = desiredBoatWidth / boatOriginalWidth;
      boat.setScale(boatScale);

      console.log(
        `Boat original width: ${boatOriginalWidth}, Scaled width: ${
          boatOriginalWidth * boatScale
        }, Scale: ${boatScale}`
      );

      this.tweens.add({
        targets: boat,
        y: baseHeight / 2 + 10 * scaleFactor,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      for (let i = 0; i < 3; i++) {
        let x, y;
        let attempts = 0;
        const maxAttempts = 10;

        do {
          x = Phaser.Math.Between(50, baseWidth - 50);
          y = Phaser.Math.Between(100, baseHeight - 100);
          attempts++;
        } while (
          isOverlapping(x, y, chestData, boat, 50 * scaleFactor) &&
          attempts < maxAttempts
        );

        if (attempts < maxAttempts) {
          spawnChest(this, x, y, scaleFactor);
        } else {
          console.warn(
            "Could not find a valid position for chest after max attempts."
          );
        }
      }
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

    function spawnChest(
      scene: Phaser.Scene,
      x: number,
      y: number,
      scaleFactor: number
    ) {
      const chest = scene.add
        .sprite(x, y, "chest")
        .setInteractive()
        .setScale(0)
        .setDepth(3) // Увеличили depth с 1 до 3, чтобы сундуки были поверх корабля
        .setActive(true) as Phaser.GameObjects.Sprite;

      // Рассчитываем масштаб сундука
      const chestTexture = scene.textures
        .get("chest")
        .getSourceImage() as HTMLImageElement;
      const chestOriginalWidth = chestTexture.width;
      const desiredChestWidth = baseWidth * 0.1;
      const chestScale = desiredChestWidth / chestOriginalWidth;
      const minChestScale = 0.05;
      const maxChestScale = 0.3;
      const finalChestScale = Math.max(
        minChestScale,
        Math.min(chestScale, maxChestScale)
      );

      const baseWaveRadius = 10;
      const waveRadius = baseWaveRadius * scaleFactor;
      const wave = scene.add.graphics().setPosition(x, y).setDepth(0); // Волны остаются на нижнем слое
      wave.lineStyle(3, 0x00ffff, 0.8);
      wave.strokeCircle(0, 0, waveRadius);

      scene.tweens.add({
        targets: wave,
        scale: 3,
        alpha: 0,
        duration: 2000,
        repeat: -1,
        onUpdate: () => {
          wave.clear();
          wave.lineStyle(3, 0x00ffff, 0.8 * wave.alpha);
          wave.strokeCircle(0, 0, waveRadius * wave.scale);
        },
      });

      scene.tweens.add({
        targets: chest,
        scale: finalChestScale,
        duration: 500,
        ease: "Bounce.easeOut",
      });

      const chestEntry = { chest, wave, x, y };
      chestData.push(chestEntry);

      chest.on("pointerdown", () => {
        const points = Phaser.Math.Between(3, 10);
        setTimeout(() => {
          setScore((prev) => {
            const newScore = prev + points;
            setBalance(newScore);
            return newScore;
          });
        }, 0);

        const baseFontSize = 16;
        const fontSize = baseFontSize * scaleFactor;
        const plusText = scene.add
          .text(chest.x, chest.y, `+${points}`, {
            fontSize: `${fontSize}px`,
            color: "#ffd700",
          })
          .setOrigin(0.5)
          .setDepth(4) // Текст очков на самом верхнем слое
          .setActive(true) as Phaser.GameObjects.Text;

        const targetY = Math.max(chest.y - 30 * scaleFactor, 0);
        scene.tweens.add({
          targets: plusText,
          y: targetY,
          alpha: 0,
          duration: 1000,
          onComplete: () => plusText.destroy(),
        });

        chest.destroy();
        wave.destroy();

        const index = chestData.indexOf(chestEntry);
        if (index !== -1) {
          chestData.splice(index, 1);
        } else {
          console.error("Chest not found in chestData!");
        }

        chestData.forEach((entry) => {
          entry.chest.setVisible(true);
          entry.wave.setVisible(true);
          entry.chest.setActive(true);
          entry.wave.setActive(true);
          scene.children.bringToTop(entry.chest); // Поднимаем сундук на верхний слой
          scene.children.bringToTop(entry.wave);
        });

        const respawnTime = Phaser.Math.Between(5000, 20000);
        console.log("Respawn time:", respawnTime / 1000, "seconds");

        scene.time.delayedCall(respawnTime, () => {
          console.log(`Timer triggered for respawn at ${x}, ${y}`);
          console.log(`Scene is active: ${scene.scene.isActive()}`);
          console.log(`Respawning chest at ${x}, ${y}`);
          spawnChest(scene, x, y, scaleFactor);
        });
      });
    }

    function update(this: Phaser.Scene) {
      const visibleCount = chestData.filter(
        (entry) => entry.chest.visible && entry.chest.active
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
          entry.chest.destroy();
          entry.wave.destroy();
        });
        currentScene = null;
      }
    };
  }, [setBalance]);

  return (
    <>
      <div className="text">Until the next sea is left:</div>
      <div className="progressBar"></div>
      <div>Balance: {score}</div>
      <div ref={gameRef} className="game-container" />
    </>
  );
}

export default Game;
