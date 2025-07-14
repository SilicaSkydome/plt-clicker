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
  location: string;
}

const initialState: GameState = {
  balance: 0,
  energy: 50,
  lastEnergyUpdate: Date.now(),
  rank: ranks[0],
  maxEnergy: 50,
  location: "1stSea",
};

const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    updateBalance(state, action: PayloadAction<number>) {
      console.log("Updating balance in gameSlice:", action.payload);
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
      console.log("Incrementing balance in gameSlice:", action.payload);
      state.balance += action.payload;
    },
    setMaxEnergy(state, action: PayloadAction<number>) {
      state.maxEnergy = action.payload;
    },
    setLocation(state, action: PayloadAction<string>) {
      console.log("Updating location in gameSlice:", action.payload);
      state.location = action.payload;
    },
  },
});

export const {
  updateBalance,
  updateEnergy,
  setRank,
  incrementBalance,
  setMaxEnergy,
  setLocation,
} = gameSlice.actions;

export default gameSlice.reducer;
