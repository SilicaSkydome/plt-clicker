// pages/Game/useEnergy.ts
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store";
import { updateEnergy } from "../../store/gameSlice";
import { saveGameData } from "../../store/userSlice";

export default function useEnergy(maxEnergy: number) {
  const dispatch = useAppDispatch();
  const energy = useAppSelector((state) => state.game.energy);
  const lastUpdate = useAppSelector((state) => state.game.lastEnergyUpdate);
  const userId = useAppSelector(
    (state) => state.user.user?.id ?? "test_user_123"
  );
  const energyRef = useRef(energy);
  const lastUpdateRef = useRef(lastUpdate);
  const [displayEnergy, setDisplayEnergy] = useState(energy);

  const syncDisplay = () => {
    setDisplayEnergy(energyRef.current);
  };

  useEffect(() => {
    let baseEnergy = energy;
    let baseTime = lastUpdate;

    const now = Date.now();
    const elapsed = (now - baseTime) / 1000;
    const restored = Math.floor(elapsed / 30);
    const finalEnergy = Math.min(baseEnergy + restored, maxEnergy);

    energyRef.current = finalEnergy;
    lastUpdateRef.current = now;
    syncDisplay();
    dispatch(updateEnergy({ energy: finalEnergy, time: now }));
    dispatch(saveGameData());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastUpdateRef.current) / 1000;
      const add = Math.floor(elapsed / 30);

      if (add > 0) {
        const newEnergy = Math.min(energyRef.current + add, maxEnergy);
        energyRef.current = newEnergy;
        lastUpdateRef.current = now;
        syncDisplay();
        dispatch(updateEnergy({ energy: newEnergy, time: now }));
        dispatch(saveGameData());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [maxEnergy]);

  return { displayEnergy, syncDisplay, energyRef, lastUpdateRef };
}
