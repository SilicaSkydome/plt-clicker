// pages/Game/useChests.ts
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

/**
 * Загружает сундуки из Firestore. Если не найдены — создаёт 3 новых.
 */
export async function loadChestData(
  userId: string,
  isTestMode: boolean
): Promise<ChestData[]> {
  if (isTestMode) {
    return [0, 1, 2].map((id) => ({
      x: 0,
      y: 0,
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

    const defaultChests: ChestData[] = [0, 1, 2].map((id) => ({
      x: 0,
      y: 0,
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
      x: 0,
      y: 0,
      id,
      lastSpawnTime: null,
      userId,
    }));
  }
}

/**
 * Сохраняет отдельный сундук в Firestore
 */
export async function saveChestData(chest: ChestData) {
  try {
    const ref = doc(db, "chests", `${chest.userId}_${chest.id}`);
    await setDoc(ref, chest);
  } catch (err) {
    console.error(`Failed to save chest ${chest.id}:`, err);
  }
}

/**
 * Определяет, должен ли сундук респавниться сейчас
 */
export function shouldRespawn(lastSpawnTime: number | null): boolean {
  if (!lastSpawnTime) return true;
  return Date.now() - lastSpawnTime >= CHEST_RESPAWN_TIME_MS;
}
