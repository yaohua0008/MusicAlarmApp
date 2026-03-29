import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  alarms: [],
  activeAlarmId: null,
  isLoading: false,
  error: null,
};

const alarmSlice = createSlice({
  name: 'alarms',
  initialState,
  reducers: {
    addAlarm: (state, action) => {
      const newAlarm = {
        id: Date.now().toString(),
        ...action.payload,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      state.alarms.push(newAlarm);
    },
    updateAlarm: (state, action) => {
      const {id, updates} = action.payload;
      const index = state.alarms.findIndex(alarm => alarm.id === id);
      if (index !== -1) {
        state.alarms[index] = {...state.alarms[index], ...updates};
      }
    },
    deleteAlarm: (state, action) => {
      state.alarms = state.alarms.filter(alarm => alarm.id !== action.payload);
    },
    toggleAlarm: (state, action) => {
      const index = state.alarms.findIndex(alarm => alarm.id === action.payload);
      if (index !== -1) {
        state.alarms[index].isActive = !state.alarms[index].isActive;
      }
    },
    setActiveAlarm: (state, action) => {
      state.activeAlarmId = action.payload;
    },
    clearActiveAlarm: state => {
      state.activeAlarmId = null;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
});

export const {
  addAlarm,
  updateAlarm,
  deleteAlarm,
  toggleAlarm,
  setActiveAlarm,
  clearActiveAlarm,
  setLoading,
  setError,
  clearError,
} = alarmSlice.actions;

export default alarmSlice.reducer;