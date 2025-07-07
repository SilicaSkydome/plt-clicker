// src/store/userSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserData, Referal, Rank } from "../Interfaces";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { initialTasks, ranks } from "../Data";
import { RootState } from "./index";

export const fetchUserData = createAsyncThunk(
  "user/fetchUserData",
  async (telegramUser: any, { rejectWithValue }) => {
    try {
      if (!telegramUser) {
        // Тестовый пользователь для браузера
        telegramUser = {
          id: "test_user_123",
          first_name: "Dev",
          username: "dev_user",
          photo_url: "",
        };
        console.log("🚧 Telegram not detected, using test user:", telegramUser);
      }

      const userId = telegramUser.id.toString();
      const userDocRef = doc(db, "userData", userId);
      const userDoc = await getDoc(userDocRef);
      const userTasks = initialTasks.map(({ action, ...rest }) => rest);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        return userData;
      } else {
        const newUser: UserData = {
          id: userId,
          firstName: telegramUser.first_name || "Unknown",
          username: telegramUser.username || "",
          lastInteraction: new Date().toISOString(),
          photoUrl: telegramUser.photo_url || "",
          balance: 0,
          tasks: userTasks,
          referals: [],
          rank: ranks[0],
          energy: 50,
          lastEnergyUpdate: Date.now(),
          selectedShip: "ship1",
          location: "1stSea",
        };
        await setDoc(userDocRef, newUser);
        return newUser;
      }
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const saveGameData = createAsyncThunk(
  "user/saveGameData",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const user = state.user.user;
    const { balance, energy, lastEnergyUpdate, rank } = state.game;
    const tasks = state.tasks.tasks;

    if (!user || user.id === "test_user_123") {
      return;
    }

    try {
      const userDocRef = doc(db, "userData", user.id);
      const tasksToSave = tasks;
      const userDataToUpdate: Partial<UserData> = {
        balance,
        energy,
        lastEnergyUpdate,
        rank,
        tasks: tasksToSave,
        lastInteraction: new Date().toISOString(),
      };

      await setDoc(userDocRef, userDataToUpdate, { merge: true });
    } catch (error) {
      return rejectWithValue("Failed to save game data");
    }
  }
);

interface UserState {
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  isLoading: true,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserData>) {
      state.user = action.payload;
    },
    updateUser(state, action: PayloadAction<Partial<UserData>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUserData.fulfilled,
        (state, action: PayloadAction<UserData>) => {
          state.user = action.payload;
          state.isLoading = false;
        }
      )
      .addCase(fetchUserData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
