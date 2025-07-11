// useVisibility.ts
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { db } from "../../../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { updateEnergy } from "../../store/gameSlice";
import { saveGameData } from "../../store/userSlice";

export function useVisibilitySync(
  energyRef: React.MutableRefObject<number>,
  lastUpdateRef: React.MutableRefObject<number>,
  syncDisplayEnergy: () => void,
  maxEnergy: number
) {
  const dispatch = useAppDispatch();
  const userId = useAppSelector(
    (state) => state.user.user?.id ?? "test_user_123"
  );
  const isTestMode = window.env?.VITE_TEST_MODE === "true";

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        userId !== "test_user_123" &&
        !isTestMode
      ) {
        try {
          const userDocRef = doc(db, "userData", userId);
          const userDoc = await getDoc(userDocRef);
          let newEnergy = energyRef.current;
          let newLastEnergyUpdate = lastUpdateRef.current;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const storedEnergy = userData.energy ?? newEnergy;
            const storedLastUpdate =
              userData.lastEnergyUpdate ?? newLastEnergyUpdate;

            if (storedLastUpdate > newLastEnergyUpdate) {
              newEnergy = storedEnergy;
              newLastEnergyUpdate = storedLastUpdate;
            }
          }

          const currentTime = Date.now();
          const timeElapsed = (currentTime - newLastEnergyUpdate) / 1000;
          const energyToAdd = Math.floor(timeElapsed / 30);
          newEnergy = Math.min(newEnergy + energyToAdd, maxEnergy);

          energyRef.current = newEnergy;
          lastUpdateRef.current = currentTime;
          syncDisplayEnergy();

          dispatch(updateEnergy({ energy: newEnergy, time: currentTime }));
          dispatch(saveGameData());
        } catch (error) {
          console.error("Error syncing on visibility change:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    dispatch,
    energyRef,
    lastUpdateRef,
    maxEnergy,
    syncDisplayEnergy,
    userId,
    isTestMode,
  ]);
}
