import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserData, Referal, Rank } from "../Interfaces";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { initialTasks, ranks } from "../Data";
import { RootState } from "./index";
import { updateBalance, updateEnergy, setLocation } from "./gameSlice";
import { setTasks } from "./tasksSlice";
import debounce from "lodash/debounce";

export const fetchUserData = createAsyncThunk(
  "user/fetchUserData",
  async (telegramUser: any, { rejectWithValue, dispatch }) => {
    try {
      if (!telegramUser) {
        telegramUser = {
          id: "test_user_123",
          first_name: "Dev",
          username: "dev_user",
          photo_url: "",
          balance: 999,
          location: "1stSea",
        };
        console.log("🚧 Telegram not detected, using test user:", telegramUser);
      }

      const userId = telegramUser.id.toString();
      const userDocRef = doc(db, "userData", userId);
      const userDoc = await getDoc(userDocRef);
      const userTasks = initialTasks.map(({ action, ...rest }) => rest);

      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        dispatch(updateBalance(userData.balance));
        dispatch(setTasks(userData.tasks));
        dispatch(
          updateEnergy({
            energy: userData.energy,
            time: userData.lastEnergyUpdate,
          })
        );
        dispatch(setLocation(userData.location));
        console.log("Fetched user data from Firestore:", userData);
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
        dispatch(updateBalance(newUser.balance));
        dispatch(setTasks(newUser.tasks));
        dispatch(
          updateEnergy({
            energy: newUser.energy,
            time: newUser.lastEnergyUpdate,
          })
        );
        dispatch(setLocation(newUser.location));
        console.log("Created new user in Firestore:", newUser);
        return newUser;
      }
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      return rejectWithValue((err as Error).message);
    }
  }
);

const debouncedSetDoc = debounce(
  async (userDocRef: any, userDataToUpdate: Partial<UserData>) => {
    await setDoc(userDocRef, userDataToUpdate, { merge: true });
  },
  500,
  { maxWait: 1000 }
);

export const saveGameData = createAsyncThunk(
  "user/saveGameData",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const user = state.user.user;
    const { balance, energy, lastEnergyUpdate, rank, location } = state.game;
    const tasks = state.tasks.tasks;

    if (!user || user.id === "test_user_123") {
      console.log("Skipping saveGameData: no user or test mode");
      return;
    }

    if (!tasks || !Array.isArray(tasks)) {
      console.error("Invalid tasks data:", tasks);
      return rejectWithValue("Invalid tasks data");
    }

    if (energy === undefined || lastEnergyUpdate === undefined) {
      console.error("Invalid energy data:", { energy, lastEnergyUpdate });
      return rejectWithValue("Invalid energy data");
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
        location,
        lastInteraction: new Date().toISOString(),
      };

      console.log("Saving to Firestore:", userDataToUpdate);
      await debouncedSetDoc(userDocRef, userDataToUpdate);
      console.log("Successfully saved to Firestore:", userDataToUpdate);
    } catch (error) {
      console.error("Failed to save game data:", error);
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
