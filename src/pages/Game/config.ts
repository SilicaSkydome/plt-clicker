// pages/Game/config.ts
import { ships, chests } from "../../Data";

// Отображение ключей кораблей и путей к текстурам (должны соответствовать preload)
export const shipTextures: Record<string, string> = {
  ship1: ships[0].image,
  ship2: ships[1].image,
  ship3: ships[2].image,
  ship4: ships[3].image,
  ship5: ships[4].image,
  ship6: ships[5].image,
};

// Коэффициенты масштаба для разных кораблей
export const shipScaleAdjustments: Record<string, number> = {
  ship1: 1.0,
  ship2: 4.5,
  ship3: 3.5,
  ship4: 3.5,
  ship5: 3.5,
  ship6: 3.5,
};
export const chestTextures: Record<string, string> = {
  commonChest: chests[0].image,
  // rareChest: chests[1].image,
};

// Настройки регенерации энергии
export const ENERGY_INTERVAL_SECONDS = 30;

// Ключ для cookies (добавляется ID пользователя)
export const ENERGY_COOKIE_KEY = (userId: string) => `energy_${userId}`;

// Интервал между спавном сундуков
export const CHEST_RESPAWN_TIME_MS = 30000;

// Минимальное расстояние между сундуками и другими объектами (в px)
export const MIN_CHEST_DISTANCE = 30;
