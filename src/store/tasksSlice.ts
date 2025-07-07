// src/store/tasksSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Task, TaskData } from "../Interfaces";
import { initialTasks } from "../Data";

interface TasksState {
  tasks: TaskData[];
}

const initialState: TasksState = {
  tasks: initialTasks.map(({ action, ...task }) => ({
    ...task,
  })),
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks(state, action: PayloadAction<Task[]>) {
      state.tasks = action.payload.map(({ action, ...task }) => ({
        ...task,
      }));
    },
    completeTask(state, action: PayloadAction<string>) {
      const task = state.tasks.find((t) => t.title === action.payload);
      if (task) {
        task.completed = true;
      }
    },
    resetTasks(state) {
      state.tasks = initialTasks.map((task) => ({
        ...task,
        completed: false,
      }));
    },
  },
});

export const { setTasks, completeTask, resetTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
