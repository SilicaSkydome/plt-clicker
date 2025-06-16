import React, { useState, useEffect, useRef } from "react";
import "./Map.css";
import Phaser from "phaser";
import { Location } from "../../Interfaces";
import sea1 from "../../assets/img/Seas/Sea1.png";
import sea2 from "../../assets/img/Seas/Sea2.png";
import sea3 from "../../assets/img/Seas/Sea3.png";
import sea4 from "../../assets/img/Seas/Sea4.png";
import sea5 from "../../assets/img/Seas/Sea5.png";
import sea6 from "../../assets/img/Seas/Sea6.png";
import sea7 from "../../assets/img/Seas/Sea7.png";
import anchor from "../../assets/img/anchor.png";

const locations: Location[] = [
  {
    id: "1stSea",
    name: "1-ST SEA",
    x: 100,
    y: 100,
    unlocked: true,
    cost: 0,
    minRank: 1,
    image: "sea1",
  },
  {
    id: "2ndSea",
    name: "2-ST SEA",
    x: 420 - 130,
    y: 130,
    unlocked: false,
    cost: 50,
    minRank: 2,
    image: "sea2",
  },
  {
    id: "3rdSea",
    name: "3-RD SEA",
    x: 420 - 130,
    y: 280,
    unlocked: false,
    cost: 100,
    minRank: 3,
    image: "sea3",
  },
  {
    id: "4thSea",
    name: "4-TH SEA",
    x: 70,
    y: 370,
    unlocked: false,
    cost: 150,
    minRank: 4,
    image: "sea4",
  },
  {
    id: "5thSea",
    name: "5-TH SEA",
    x: 420 - 170,
    y: 400,
    unlocked: false,
    cost: 200,
    minRank: 5,
    image: "sea5",
  },
  {
    id: "6thSea",
    name: "6-TH SEA",
    x: 100,
    y: 520,
    unlocked: false,
    cost: 250,
    minRank: 6,
    image: "sea6",
  },
  {
    id: "7thSea",
    name: "7-TH SEA",
    x: 420 - 130,
    y: 550,
    unlocked: false,
    cost: 300,
    minRank: 7,
    image: "sea7",
  },
];

interface MapProps {
  location: string;
  setLocation: (location: string) => void;
}

function RoadMap({ location, setLocation }: MapProps) {
  const [baseWidth, setBaseWidth] = useState(
    window.innerWidth - 60 > 400 ? 400 : window.innerWidth - 60
  );
  const [baseHeight, setBaseHeight] = useState(window.innerHeight - 200);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<Phaser.Scene | null>(null);

  // Инициализация игры с передачей начального location через sceneConfig
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: baseWidth,
      height: baseHeight,
      parent: "phaser-container",
      scene: [
        {
          key: "MapScene",
          init: function (this: Phaser.Scene) {
            // Инициализация сцены с переданным значением
            const initialLocation =
              this.registry.get("initialLocation") || location;
            this.data.set("initialLocation", initialLocation);
          },
          create: MapScene.prototype.create,
          preload: MapScene.prototype.preload,
        },
      ],
      backgroundColor: "#212324",
      callbacks: {
        postBoot: (game) => {
          gameRef.current = game;
          console.log("Game initialized with location:", location);
          game.events.on("locationSelected", (locationId: string) => {
            console.log("Attempting to select location:", locationId);
            setLocation(locationId);
            // Обновляем активное море в сцене
            if (sceneRef.current) {
              const seaImages = sceneRef.current.children.list.filter(
                (obj) =>
                  obj instanceof Phaser.GameObjects.Image &&
                  obj.texture.key.startsWith("sea")
              ) as Phaser.GameObjects.Image[];
              const newIndex = locations.findIndex(
                (loc) => loc.id === locationId
              );
              if (newIndex !== -1) {
                seaImages.forEach((img) => {
                  const loc = locations.find(
                    (l) => l.image === img.texture.key
                  );
                  img.setTint(loc?.unlocked ? 0xffd57b : 0xffffff);
                });
                seaImages[newIndex].setTint(0x00ff00);
              }
            }
          });
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
  }, [baseWidth, baseHeight, location]);

  // Синхронизация с пропсом location
  useEffect(() => {
    if (sceneRef.current) {
      const seaImages = sceneRef.current.children.list.filter(
        (obj) =>
          obj instanceof Phaser.GameObjects.Image &&
          obj.texture.key.startsWith("sea")
      ) as Phaser.GameObjects.Image[];
      const newIndex = locations.findIndex((loc) => loc.id === location);
      if (newIndex !== -1) {
        seaImages.forEach((img) => {
          const loc = locations.find((l) => l.image === img.texture.key);
          img.setTint(loc?.unlocked ? 0xffd57b : 0xffffff);
        });
        seaImages[newIndex].setTint(0x00ff00);
      }
    }
  }, [location]);

  // Обработчик изменения размеров
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
          .setTint(loc.unlocked ? 0xffd57b : 0xffffff)
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

      // Устанавливаем начальное выделение на основе переданного location
      const initialLocation = this.data.get("initialLocation");
      let activeSeaIndex: number | null = locations.findIndex(
        (loc) => loc.id === initialLocation
      );
      if (activeSeaIndex !== -1) {
        seaImages[activeSeaIndex].setTint(0x00ff00);
      }

      seaImages.forEach((sea, index) => {
        sea.on("pointerdown", () => {
          console.log("Selected location:", locations[index].id);
          seaImages.forEach((img) => {
            const loc = locations.find((l) => l.image === img.texture.key);
            img.setTint(loc?.unlocked ? 0xffd57b : 0xffffff);
          });
          sea.setTint(0x00ff00);
          activeSeaIndex = index;

          this.game.events.emit("locationSelected", locations[index].id);
        });
      });
    }
  }

  return (
    <div className="map">
      <h2>Roadmap</h2>
      <div className="map-container" id="map-container">
        <div id="phaser-container"></div>
      </div>
      {location && <p>Выбрано море: {location}</p>}
    </div>
  );
}
export default RoadMap;
