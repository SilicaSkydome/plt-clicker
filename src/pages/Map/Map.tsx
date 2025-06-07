import React, { useState, useEffect } from "react";
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
    x: window.innerWidth - 130,
    y: 130,
    unlocked: false,
    cost: 50,
    minRank: 2,
    image: "sea2",
  },
  {
    id: "3rdSea",
    name: "3-RD SEA",
    x: window.innerWidth - 130,
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
    x: window.innerWidth - 170,
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
    x: window.innerWidth - 130,
    y: 550,
    unlocked: false,
    cost: 300,
    minRank: 7,
    image: "sea7",
  },
];

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
    var scaleFator = 1;
    if (window.innerWidth < 400) {
      scaleFator = 0.7; // Уменьшаем масштаб для маленьких экранов
    }

    const seaImages: Phaser.GameObjects.Image[] = [];
    locations.forEach((loc) => {
      if (window.innerHeight < 600) {
        loc.y = loc.y * scaleFator; // Уменьшаем высоту для мобильных устройств
      }
      const sea = this.add
        .image(loc.x, loc.y * scaleFator, loc.image)
        .setScale(scaleFator)
        .setTint(loc.unlocked ? 0xffd57b : 0xffffff)
        .setInteractive({
          useHandCursor: true,
          pixelPerfect: true,
        })
        .setDepth(10) as Phaser.GameObjects.Image;
      seaImages.push(sea);
      this.add.image(loc.x, loc.y * scaleFator, "anchor").setScale(scaleFator);
      this.add
        .text(loc.x - 50, (loc.y + 30) * scaleFator, loc.name, {
          fontSize: `${16 * scaleFator}px`,
        })
        .setOrigin(0.5);
    });

    const graphics = this.add.graphics().setDepth(-1); // Устанавливаем глубину графики
    graphics.lineStyle(2, 0xffd900, 1); // Золотая линия толщиной 2 пикселя

    // Получаем центральные точки локаций
    const points = locations.map(
      (loc) => new Phaser.Math.Vector2(loc.x, loc.y * scaleFator)
    );

    // Рисуем изогнутые пунктирные линии между соседними точками
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];

      // Фиксированное смещение для контрольной точки (единообразная кривизна)
      const control = new Phaser.Math.Vector2(
        (start.x + end.x) / 2,
        (start.y + end.y) / 2 - 50 // Фиксированное смещение 50 пикселей
      );

      // Создаем квадратичную кривую
      const curve = new Phaser.Curves.QuadraticBezier(start, control, end);
      const curveLength = curve.getLength();

      // Настраиваем пунктир с фиксированной длиной
      const dashLength = 5; // Фиксированная длина черты
      const gapLength = 10; // Фиксированная длина промежутка
      const segmentLength = dashLength + gapLength; // Длина полного сегмента (черта + промежуток)
      let distance = 0;

      graphics.beginPath(); // Начинаем путь для всей кривой

      while (distance < curveLength) {
        const t1 = distance / curveLength; // Начало сегмента
        const dashEnd = Math.min(distance + dashLength, curveLength);
        const t2 = dashEnd / curveLength; // Конец черты

        const p1 = curve.getPoint(t1);
        const p2 = curve.getPoint(t2);

        // Рисуем черту
        graphics.moveTo(p1.x, p1.y);
        graphics.lineTo(p2.x, p2.y);

        // Переходим к следующему сегменту (черта + промежуток)
        distance += segmentLength;
      }

      graphics.strokePath(); // Рисуем весь путь одним вызовом
    }

    // Механика активного моря
    seaImages.forEach((sea, index) => {
      sea.on("pointerdown", () => {
        // Сбрасываем цвет всех морей
        seaImages.forEach((img) => {
          const loc = locations.find((l) => l.image === img.texture.key);
          img.setTint(loc?.unlocked ? 0xffd57b : 0xffffff);
        });
        // Устанавливаем активный цвет для выбранного моря
        sea.setTint(0x00ff00); // Зеленый цвет для активного моря

        this.events.emit("locationSelected", locations[index].id);
      });
    });
  }
}

function RoadMap() {
  const [baseWidth, setBaseWidth] = useState(window.innerWidth - 60);
  const [baseHeight, setBaseHeight] = useState(window.innerHeight - 200);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: baseWidth,
      height: baseHeight,
      parent: "phaser-container",
      scene: MapScene,
      backgroundColor: "#212324",
      callbacks: {
        postBoot: (game) => {
          game.events.on("locationSelected", (locationId: string) => {
            setSelectedLocation(locationId);
          });
        },
      },
    };
    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, []);

  return (
    <div className="map">
      <h2>Roadmap</h2>
      <div className="map-container" id="map-container">
        <div id="phaser-container"></div>
      </div>
      {selectedLocation && <p>Выбрано море: {selectedLocation}</p>}
    </div>
  );
}
export default RoadMap;
