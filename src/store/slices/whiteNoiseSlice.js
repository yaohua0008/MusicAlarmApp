import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  startWhiteNoise, 
  stopWhiteNoise, 
  getWhiteNoiseList,
  getWhiteNoiseSettings,
  setWhiteNoiseVolume,
  setWhiteNoiseEnabled
} from '../../services/whiteNoiseService';

// 异步thunks
export const fetchWhiteNoiseList = createAsyncThunk(
  'whiteNoise/fetchList',
  async () => {
    const list = await getWhiteNoiseList();
    return list;
  }
);

export const fetchWhiteNoiseSettings = createAsyncThunk(
  'whiteNoise/fetchSettings',
  async () => {
    const settings = await getWhiteNoiseSettings();
    return settings;
  }
);

export const toggleWhiteNoise = createAsyncThunk(
  'whiteNoise/toggle',
  async ({ noiseId, volume }, { getState, dispatch }) => {
    const state = getState();
    const isEnabled = state.whiteNoise.settings.enabled;
    const currentNoise = state.whiteNoise.settings.selectedNoise;
    const currentVolume = volume || state.whiteNoise.settings.volume;

    if (isEnabled && currentNoise === noiseId) {
      // 如果相同的白噪音正在播放，停止它
      await stopWhiteNoise();
      await setWhiteNoiseEnabled(false);
      return { enabled: false, selectedNoise: noiseId, volume: currentVolume };
    } else {
      // 停止当前播放（如果有），然后开始新的
      if (isEnabled) {
        await stopWhiteNoise();
      }
      await startWhiteNoise(noiseId, currentVolume);
      await setWhiteNoiseEnabled(true);
      return { enabled: true, selectedNoise: noiseId, volume: currentVolume };
    }
  }
);

export const updateWhiteNoiseVolume = createAsyncThunk(
  'whiteNoise/updateVolume',
  async (volume, { getState, dispatch }) => {
    const state = getState();
    const isEnabled = state.whiteNoise.settings.enabled;
    const currentNoise = state.whiteNoise.settings.selectedNoise;

    await setWhiteNoiseVolume(volume);
    
    // 如果白噪音正在播放，更新音量
    if (isEnabled && currentNoise) {
      await startWhiteNoise(currentNoise, volume);
    }
    
    return volume;
  }
);

export const stopWhiteNoisePlayback = createAsyncThunk(
  'whiteNoise/stop',
  async (_, { dispatch }) => {
    await stopWhiteNoise();
    await setWhiteNoiseEnabled(false);
    return { enabled: false };
  }
);

const whiteNoiseSlice = createSlice({
  name: 'whiteNoise',
  initialState: {
    list: [],
    settings: {
      enabled: false,
      selectedNoise: 'rain',
      volume: 0.5,
      timerEnabled: false,
      timerDuration: 60, // 分钟
      fadeOutEnabled: true,
    },
    playback: {
      isPlaying: false,
      currentNoise: null,
      startTime: null,
      elapsedTime: 0,
    },
    loading: false,
    error: null,
  },
  reducers: {
    setPlaybackState: (state, action) => {
      state.playback = { ...state.playback, ...action.payload };
    },
    updateElapsedTime: (state) => {
      if (state.playback.isPlaying && state.playback.startTime) {
        const elapsed = Math.floor((Date.now() - state.playback.startTime) / 1000);
        state.playback.elapsedTime = elapsed;
        
        // 检查定时器是否到期
        if (state.settings.timerEnabled && 
            elapsed >= state.settings.timerDuration * 60) {
          state.playback.isPlaying = false;
          state.settings.enabled = false;
        }
      }
    },
    resetPlayback: (state) => {
      state.playback = {
        isPlaying: false,
        currentNoise: null,
        startTime: null,
        elapsedTime: 0,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchWhiteNoiseList
      .addCase(fetchWhiteNoiseList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhiteNoiseList.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchWhiteNoiseList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchWhiteNoiseSettings
      .addCase(fetchWhiteNoiseSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhiteNoiseSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(fetchWhiteNoiseSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // toggleWhiteNoise
      .addCase(toggleWhiteNoise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleWhiteNoise.fulfilled, (state, action) => {
        state.loading = false;
        state.settings.enabled = action.payload.enabled;
        state.settings.selectedNoise = action.payload.selectedNoise;
        state.settings.volume = action.payload.volume;
        state.playback.isPlaying = action.payload.enabled;
        state.playback.currentNoise = action.payload.enabled ? action.payload.selectedNoise : null;
        state.playback.startTime = action.payload.enabled ? Date.now() : null;
        state.playback.elapsedTime = 0;
      })
      .addCase(toggleWhiteNoise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // updateWhiteNoiseVolume
      .addCase(updateWhiteNoiseVolume.fulfilled, (state, action) => {
        state.settings.volume = action.payload;
      })
      // stopWhiteNoisePlayback
      .addCase(stopWhiteNoisePlayback.fulfilled, (state, action) => {
        state.settings.enabled = action.payload.enabled;
        state.playback.isPlaying = false;
        state.playback.currentNoise = null;
        state.playback.startTime = null;
        state.playback.elapsedTime = 0;
      });
  },
});

export const { 
  setPlaybackState, 
  updateElapsedTime, 
  resetPlayback 
} = whiteNoiseSlice.actions;

export default whiteNoiseSlice.reducer;