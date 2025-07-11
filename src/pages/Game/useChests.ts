import { useAppSelector } from "../../store";
import { db } from "../../../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
} from "firebase/firestore";
import { ChestData } from "../../Interfaces";
import { CHEST_RESPAWN_TIME_MS } from "./config";

export async function loadChestData(
  userId: string,
  isTestMode: boolean,
  baseWidth: number,
  baseHeight: number
): Promise<ChestData[]> {
  if (isTestMode) {
    console.log(`Test mode enabled, generating default chests for ${userId}`);
    return [0, 1, 2].map((id) => ({
      x: Math.random() * (baseWidth - 50) + 25,
      y: Math.random() * (baseHeight - 50) + 25,
      id,
      lastSpawnTime: null,
      userId,
    }));
  }

  try {
    const chestsQuery = query(
      collection(db, "chests"),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(chestsQuery);
    if (!snapshot.empty) {
      return snapshot.docs.map((doc) => doc.data() as ChestData);
    }

    // Use the actual canvas size if available, otherwise fallback to baseWidth/baseHeight
    const canvas = document.getElementById(
      "game-canvas"
    ) as HTMLCanvasElement | null;
    const width = canvas ? canvas.width : baseWidth;
    const height = canvas ? canvas.height : baseHeight;

    const defaultChests: ChestData[] = [0, 1, 2].map((id) => ({
      x: Math.random() * (width - 50) + 25,
      y: Math.random() * (height - 50) + 25,
      id,
      lastSpawnTime: null,
      userId,
    }));
    for (const chest of defaultChests) {
      await saveChestData(chest);
    }
    return defaultChests;
  } catch (err) {
    console.error("Failed to load chests:", err);
    return [0, 1, 2].map((id) => ({
      x: Math.random() * (baseWidth - 50) + 25,
      y: Math.random() * (baseHeight - 50) + 25,
      id,
      lastSpawnTime: null,
      userId,
    }));
  }
}

export async function saveChestData(chest: ChestData) {
  try {
    const ref = doc(db, "chests", `${chest.userId}_${chest.id}`);
    await setDoc(ref, chest);
  } catch (err) {
    console.error(`Failed to save chest ${chest.id}:`, err);
  }
}

export function shouldRespawn(lastSpawnTime: number | null): boolean {
  // Спавним сразу, если lastSpawnTime отсутствует или не был установлен (например, при перезагрузке)
  if (!lastSpawnTime || lastSpawnTime === 0) return true;
  // Проверяем таймер только после активации (клика)
  return Date.now() - lastSpawnTime >= CHEST_RESPAWN_TIME_MS;
}
