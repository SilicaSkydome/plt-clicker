// pages/Game/usePhaserGame.ts
import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { shipTextures, shipScaleAdjustments } from "./config";

export function usePhaserGame(
  containerRef: React.RefObject<HTMLDivElement | null>,
  baseWidth: number,
  baseHeight: number,
  scaleFactor: number,
  selectedShip: string
) {
  const gameInstance = useRef<Phaser.Game | null>(null);
  const boatRef = useRef<Phaser.GameObjects.Image | null>(null);

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
        this.load.image(key, `${key}`);
      });
    }

    function create(this: Phaser.Scene) {
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
    }

    function update(this: Phaser.Scene) {
      // логика обновления, если потребуется
    }

    if (!gameInstance.current) {
      gameInstance.current = new Phaser.Game(config);
    }

    return () => {
      if (gameInstance.current) {
        gameInstance.current.destroy(true);
        gameInstance.current = null;
      }
    };
  }, [baseWidth, baseHeight, scaleFactor, selectedShip]);

  return { boatRef, gameInstance };
}
