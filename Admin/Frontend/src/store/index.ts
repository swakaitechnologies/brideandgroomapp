import { configureStore } from "@reduxjs/toolkit";
import dashboardReducer from "./slices/dashboardSlice";
import userReducer from "./slices/userSlice";
import settingsReducer from "./slices/settingsSlice";

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
    users: userReducer,
    settings: settingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;





