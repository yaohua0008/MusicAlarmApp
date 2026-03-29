import {configureStore} from '@reduxjs/toolkit';
import alarmReducer from './slices/alarmSlice';
import musicReducer from './slices/musicSlice';
import settingsReducer from './slices/settingsSlice';
import sleepReducer from './slices/sleepSlice';
import whiteNoiseReducer from './slices/whiteNoiseSlice';

const store = configureStore({
  reducer: {
    alarms: alarmReducer,
    music: musicReducer,
    settings: settingsReducer,
    sleep: sleepReducer,
    whiteNoise: whiteNoiseReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;