import React, { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../store";
import { setLocation } from "../../store/gameSlice";
import { saveGameData } from "../../store/userSlice";
import "./Map.css";
import Phaser from "phaser";
import { locations } from "../../Data";
import sea1 from "../../assets/img/Seas/Sea1.png";
import sea2 from "../../assets/img/Seas/Sea2.png";
import sea3 from "../../assets/img/Seas/Sea3.png";
import sea4 from "../../assets/img/Seas/Sea4.png";
import sea5 from "../../assets/img/Seas/Sea5.png";
import sea6 from "../../assets/img/Seas/Sea6.png";
import sea7 from "../../assets/img/Seas/Sea7.png";
import anchor from "../../assets/img/anchor.png";
import toast from "react-hot-toast";

function RoadMap() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const currentLocation = useAppSelector((state) => state.game.location);
  const balance = useAppSelector((state) => state.game.balance);
  const rank = useAppSelector((state) => state.game.rank);

  const [baseWidth, setBaseWidth] = useState(
    window.innerWidth - 60 > 400 ? 400 : window.innerWidth - 60
  );
  const [baseHeight, setBaseHeight] = useState(window.innerHeight - 200);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: baseWidth,
      height: baseHeight,
      parent: "phaser-container",
      scene: {
        key: "MapScene",
        preload: MapScene.prototype.preload,
        create: MapScene.prototype.create,
      },
      backgroundColor: "#212324",
      callbacks: {
        postBoot: (game) => {
          gameRef.current = game;
          console.log("Game initialized with location:", currentLocation);
        },
      },
    };

    const game = new Phaser.Game(config);
    return () => {
      if (gameRef.current) {
        gameRef.current.events.off("locationSelected");
      }
      game.destroy(true);
    };
  }, [baseWidth, baseHeight]);

  useEffect(() => {
    if (sceneRef.current && currentLocation) {
      const seaImages = sceneRef.current.children.list.filter(
        (obj) =>
          obj instanceof Phaser.GameObjects.Image &&
          obj.texture.key.startsWith("sea")
      ) as Phaser.GameObjects.Image[];
      const newIndex = locations.findIndex((loc) => loc.id === currentLocation);
      if (newIndex !== -1) {
        seaImages.forEach((img) => {
          const loc = locations.find((l) => l.image === img.texture.key);
          img.setTint(
            loc?.id === currentLocation
              ? 0x00ff00
              : loc?.unlocked
              ? 0xffd57b
              : 0xffffff
          );
        });
      }
    }
  }, [currentLocation]);

  useEffect(() => {
    const handleResize = () => {
      const newWidth =
        window.innerWidth - 60 > 400 ? 400 : window.innerWidth - 60;
      const newHeight = window.innerHeight - 200;
      setBaseWidth(newWidth);
      setBaseHeight(newHeight);
      if (gameRef.current) {
        gameRef.current.scale.resize(newWidth, newHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  class MapScene extends Phaser.Scene {
    constructor() {
      super({ key: "MapScene" });
    }

    preload() {
      this.load.image("sea1", sea1);
      this.load.image("sea2", sea2);
      this.load.image("sea3", sea3);
      this.load.image("sea4", sea4);
      this.load.image("sea5", sea5);
      this.load.image("sea6", sea6);
      this.load.image("sea7", sea7);
      this.load.image("anchor", anchor);
    }

    create() {
      const scaleFactor = window.innerWidth < 400 ? 0.7 : 1;
      sceneRef.current = this;

      const seaImages: Phaser.GameObjects.Image[] = [];
      locations.forEach((loc) => {
        const adjustedY =
          window.innerHeight < 600 ? loc.y * scaleFactor : loc.y;
        const sea = this.add
          .image(loc.x, adjustedY, loc.image)
          .setScale(scaleFactor)
          .setTint(
            loc.id === currentLocation
              ? 0x00ff00
              : loc.unlocked
              ? 0xffd57b
              : 0xffffff
          )
          .setInteractive({
            useHandCursor: true,
            pixelPerfect: true,
          })
          .setDepth(10) as Phaser.GameObjects.Image;
        seaImages.push(sea);
        this.add.image(loc.x, adjustedY, "anchor").setScale(scaleFactor);
        this.add
          .text(loc.x - 50, adjustedY + 30 * scaleFactor, loc.name, {
            fontSize: `${16 * scaleFactor}px`,
          })
          .setOrigin(0.5);
      });

      const graphics = this.add.graphics().setDepth(-1);
      graphics.lineStyle(2, 0xffd900, 1);

      const points = locations.map((loc) => {
        const adjustedY =
          window.innerHeight < 600 ? loc.y * scaleFactor : loc.y;
        return new Phaser.Math.Vector2(loc.x, adjustedY);
      });

      for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const control = new Phaser.Math.Vector2(
          (start.x + end.x) / 2,
          (start.y + end.y) / 2 - 50
        );

        const curve = new Phaser.Curves.QuadraticBezier(start, control, end);
        const curveLength = curve.getLength();

        const dashLength = 5;
        const gapLength = 10;
        const segmentLength = dashLength + gapLength;
        let distance = 0;

        graphics.beginPath();

        while (distance < curveLength) {
          const t1 = distance / curveLength;
          const dashEnd = Math.min(distance + dashLength, curveLength);
          const t2 = dashEnd / curveLength;

          const p1 = curve.getPoint(t1);
          const p2 = curve.getPoint(t2);

          graphics.moveTo(p1.x, p1.y);
          graphics.lineTo(p2.x, p2.y);

          distance += segmentLength;
        }

        graphics.strokePath();
      }

      seaImages.forEach((sea, index) => {
        sea.on("pointerdown", async () => {
          const selectedLocation = locations[index];
          if (!selectedLocation.unlocked) {
            // Проверка условий для разблокировки
            if (
              balance >= selectedLocation.cost &&
              rank.level >= selectedLocation.minRank
            ) {
              try {
                dispatch(setLocation(selectedLocation.id));
                await dispatch(saveGameData());
                console.log(
                  "Location selected and saved:",
                  selectedLocation.id
                );
                seaImages.forEach((img) => {
                  const loc = locations.find(
                    (l) => l.image === img.texture.key
                  );
                  img.setTint(
                    loc?.id === selectedLocation.id
                      ? 0x00ff00
                      : loc?.unlocked
                      ? 0xffd57b
                      : 0xffffff
                  );
                });
              } catch (error) {
                console.error("Failed to save location:", error);
              }
            } else {
              console.log(
                "Cannot select location: insufficient balance or rank",
                {
                  balance,
                  requiredBalance: selectedLocation.cost,
                  rankLevel: rank.level,
                  requiredRank: selectedLocation.minRank,
                }
              );
              toast.error(
                `Insufficient funds or level to unlock ${selectedLocation.name}.`
              );
            }
          } else {
            try {
              dispatch(setLocation(selectedLocation.id));
              await dispatch(saveGameData()).unwrap();
              console.log("Location selected and saved:", selectedLocation.id);
              seaImages.forEach((img) => {
                const loc = locations.find((l) => l.image === img.texture.key);
                img.setTint(
                  loc?.id === selectedLocation.id
                    ? 0x00ff00
                    : loc?.unlocked
                    ? 0xffd57b
                    : 0xffffff
                );
              });
            } catch (error) {
              console.error("Failed to save location:", error);
            }
          }
        });
      });
    }
  }

  if (!user) return <div>Загрузка...</div>;

  return (
    <div className="map">
      <h2>Roadmap</h2>
      <div className="map-container" id="map-container">
        <div id="phaser-container"></div>
      </div>
      {currentLocation && (
        <p>
          Выбрано море:{" "}
          {locations.find((loc) => loc.id === currentLocation)?.name ||
            currentLocation}
        </p>
      )}
    </div>
  );
}

export default RoadMap;
