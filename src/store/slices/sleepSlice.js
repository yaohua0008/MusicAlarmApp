import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getSleepAnalysis, 
  getSleepStatistics,
  getSleepSettings,
  setSleepGoal,
  setSmartWakeup
} from '../../services/sleepAnalysisService';

// 异步thunks
export const fetchSleepData = createAsyncThunk(
  'sleep/fetchData',
  async () => {
    const data = await getSleepAnalysis();
    return data;
  }
);

export const fetchSleepStatistics = createAsyncThunk(
  'sleep/fetchStatistics',
  async () => {
    const stats = await getSleepStatistics();
    return stats;
  }
);

export const fetchSleepSettings = createAsyncThunk(
  'sleep/fetchSettings',
  async () => {
    const settings = await getSleepSettings();
    return settings;
  }
);

export const updateSleepGoal = createAsyncThunk(
  'sleep/updateGoal',
  async (hours, { dispatch }) => {
    await setSleepGoal(hours);
    dispatch(fetchSleepSettings());
    return hours;
  }
);

export const updateSmartWakeup = createAsyncThunk(
  'sleep/updateSmartWakeup',
  async (enabled, { dispatch }) => {
    await setSmartWakeup(enabled);
    dispatch(fetchSleepSettings());
    return enabled;
  }
);

const sleepSlice = createSlice({
  name: 'sleep',
  initialState: {
    data: {
      isTracking: false,
      currentSession: null,
      lastSession: null,
      sleepRecords: [],
    },
    settings: {
      sleepGoal: 8,
      smartWakeupEnabled: false,
      smartWakeupWindow: 30, // 智能唤醒窗口（分钟）
      bedtimeReminder: true,
      wakeupReminder: true,
    },
    statistics: {
      avgSleepHours: 0,
      avgSleepQuality: 0,
      sleepStreak: 0,
      totalSleepDays: 0,
      last7Days: [],
      monthlyTrend: [],
    },
    loading: false,
    error: null,
  },
  reducers: {
    startTracking: (state) => {
      state.data.isTracking = true;
      state.data.currentSession = {
        startTime: new Date().toISOString(),
        stages: [],
        movements: 0,
      };
    },
    stopTracking: (state, action) => {
      state.data.isTracking = false;
      if (state.data.currentSession) {
        state.data.lastSession = {
          ...state.data.currentSession,
          endTime: new Date().toISOString(),
          qualityScore: action.payload?.qualityScore || 0,
          totalHours: action.payload?.totalHours || 0,
        };
        state.data.sleepRecords.unshift(state.data.lastSession);
        state.data.currentSession = null;
      }
    },
    addSleepStage: (state, action) => {
      if (state.data.currentSession) {
        state.data.currentSession.stages.push(action.payload);
      }
    },
    recordMovement: (state) => {
      if (state.data.currentSession) {
        state.data.currentSession.movements += 1;
      }
    },
    clearSleepData: (state) => {
      state.data.sleepRecords = [];
      state.statistics = {
        avgSleepHours: 0,
        avgSleepQuality: 0,
        sleepStreak: 0,
        totalSleepDays: 0,
        last7Days: [],
        monthlyTrend: [],
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSleepData
      .addCase(fetchSleepData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSleepData.fulfilled, (state, action) => {
        state.loading = false;
        state.data = { ...state.data, ...action.payload };
      })
      .addCase(fetchSleepData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchSleepStatistics
      .addCase(fetchSleepStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSleepStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchSleepStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchSleepSettings
      .addCase(fetchSleepSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSleepSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchSleepSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // updateSleepGoal
      .addCase(updateSleepGoal.fulfilled, (state, action) => {
        state.settings.sleepGoal = action.payload;
      })
      // updateSmartWakeup
      .addCase(updateSmartWakeup.fulfilled, (state, action) => {
        state.settings.smartWakeupEnabled = action.payload;
      });
  },
});

export const { 
  startTracking, 
  stopTracking, 
  addSleepStage, 
  recordMovement,
  clearSleepData 
} = sleepSlice.actions;

export default sleepSlice.reducer;