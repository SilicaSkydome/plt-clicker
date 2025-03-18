import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import React from "react";
import chest from "../../assets/img/Chest.png";
// import boat from "../../assets/img/boat.png";
import "./Game.css";

interface GameProps {
  setBalance: (value: number) => void;
}

function Game({ setBalance }: GameProps) {
  const gameRef = useRef<HTMLDivElement | null>(null);
  const gameInstance = useRef<Phaser.Game | null>(null); // Храним экземпляр игры
  const [score, setScore] = useState(0);

  useEffect(() => {
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight - 150;
    const aspectRatio = baseHeight / baseWidth;

    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight - 150;

    let gameWidth = containerWidth;
    let gameHeight = containerWidth * aspectRatio;

    if (gameHeight > containerHeight) {
      gameHeight = containerHeight;
      gameWidth = containerHeight / aspectRatio;
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
    };

    let currentScene: Phaser.Scene | null = null;
    let chestData: Array<{
      chest: Phaser.GameObjects.Sprite;
      wave: Phaser.GameObjects.Graphics;
      x: number;
      y: number;
    }> = [];
    let lastVisibleCount: number | null = null; // Для ограничения логов

    function preload(this: Phaser.Scene) {
      this.load.image("chest", chest);
      // this.load.image("boat", boat);
    }

    function create(this: Phaser.Scene) {
      currentScene = this;

      const boat = this.add
        .image(baseWidth / 2, baseHeight / 2, "boat")
        .setScale(0.5) as Phaser.GameObjects.Image;
      boat.setDepth(2);
      this.tweens.add({
        targets: boat,
        y: baseHeight / 2 + 10,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      console.log("Initializing chests...");
      for (let i = 0; i < 3; i++) {
        const x = Phaser.Math.Between(50, baseWidth - 50);
        const y = Phaser.Math.Between(100, baseHeight - 100);
        spawnChest(this, x, y);
      }
    }

    function spawnChest(scene: Phaser.Scene, x: number, y: number) {
      const chest = scene.add
        .sprite(x, y, "chest")
        .setInteractive()
        .setScale(0) as Phaser.GameObjects.Sprite;
      chest.setDepth(1);
      chest.setActive(true);

      const wave = scene.add.graphics() as Phaser.GameObjects.Graphics;
      wave.setPosition(x, y);
      wave.setDepth(0);
      wave.lineStyle(3, 0x00ffff, 0.8);
      wave.strokeCircle(0, 0, 15);

      scene.tweens.add({
        targets: wave,
        scale: 2,
        alpha: 0,
        duration: 2000,
        repeat: -1,
        onUpdate: () => {
          wave.clear();
          wave.lineStyle(3, 0x00ffff, 0.8 * wave.alpha);
          wave.strokeCircle(0, 0, 15 * wave.scale);
        },
      });

      scene.tweens.add({
        targets: chest,
        scale: 4,
        duration: 500,
        ease: "Bounce.easeOut",
      });

      const chestEntry = { chest, wave, x, y };
      chestData.push(chestEntry);
      console.log(
        `Spawned chest at ${x}, ${y}. Total chests: ${chestData.length}`
      );

      chest.on("pointerdown", () => {
        console.log(`Clicked chest at ${x}, ${y}`);
        console.log("Chests before removal:", chestData.length);

        const points = Phaser.Math.Between(3, 10);
        // Асинхронное обновление счета через setTimeout
        setTimeout(() => {
          setScore((prev) => {
            const newScore = prev + points;
            setBalance(newScore);
            return newScore;
          });
        }, 0);

        const plusText = scene.add
          .text(chest.x, chest.y, `+${points}`, {
            fontSize: "24px",
            color: "#ffd700",
          })
          .setOrigin(0.5)
          .setDepth(3) as Phaser.GameObjects.Text;

        const targetY = Math.max(chest.y - 40, 0);
        scene.tweens.add({
          targets: plusText,
          y: targetY,
          alpha: 0,
          duration: 1000,
          onComplete: () => plusText.destroy(),
        });

        // Удаляем только текущий сундук и волну
        chest.destroy();
        wave.destroy();

        // Удаляем из массива
        const index = chestData.indexOf(chestEntry);
        if (index !== -1) {
          chestData.splice(index, 1);
        } else {
          console.error("Chest not found in chestData!");
        }

        // Устанавливаем видимость и активность оставшихся сундуков
        chestData.forEach((entry) => {
          entry.chest.setVisible(true);
          entry.wave.setVisible(true);
          entry.chest.setActive(true);
          entry.wave.setActive(true);
          scene.children.bringToTop(entry.chest);
          scene.children.bringToTop(entry.wave);
        });

        console.log("Chests after removal:", chestData.length);
        console.log(
          "Remaining chests on canvas:",
          chestData.map((entry) => ({
            x: entry.chest.x,
            y: entry.chest.y,
            visible: entry.chest.visible,
            active: entry.chest.active,
          }))
        );

        // Запускаем таймер респавна через Phaser
        const respawnTime = Phaser.Math.Between(5000, 20000);
        console.log("Respawn time:", respawnTime / 1000, "seconds");

        scene.time.delayedCall(respawnTime, () => {
          console.log(`Timer triggered for respawn at ${x}, ${y}`);
          console.log(`Scene is active: ${scene.scene.isActive()}`);
          console.log(`Respawning chest at ${x}, ${y}`);
          spawnChest(scene, x, y);
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

    // Создаем игру только один раз
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
  }, [setBalance]); // Убрали score из зависимостей

  return (
    <>
      <div className="text">Until the next sea is left:</div>
      <div className="progressBar"></div>
      <div ref={gameRef} className="game-container" />
    </>
  );
}

export default Game;
