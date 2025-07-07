// src/store/gameSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Rank } from "../Interfaces";
import { ranks } from "../Data";

interface GameState {
  balance: number;
  energy: number;
  lastEnergyUpdate: number;
  rank: Rank;
  maxEnergy: number;
}

const initialState: GameState = {
  balance: 0,
  energy: 50,
  lastEnergyUpdate: Date.now(),
  rank: ranks[0],
  maxEnergy: 50,
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    updateBalance(state, action: PayloadAction<number>) {
      state.balance = action.payload;
    },
    updateEnergy(
      state,
      action: PayloadAction<{ energy: number; time: number }>
    ) {
      state.energy = action.payload.energy;
      state.lastEnergyUpdate = action.payload.time;
    },
    setRank(state, action: PayloadAction<Rank>) {
      state.rank = action.payload;
    },
    incrementBalance(state, action: PayloadAction<number>) {
      state.balance += action.payload;
    },
    setMaxEnergy(state, action: PayloadAction<number>) {
      state.maxEnergy = action.payload;
    },
  },
});

export const {
  updateBalance,
  updateEnergy,
  setRank,
  incrementBalance,
  setMaxEnergy,
} = gameSlice.actions;

export default gameSlice.reducer;
