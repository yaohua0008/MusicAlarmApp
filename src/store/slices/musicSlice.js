import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  currentTrack: null,
  playlist: [],
  isPlaying: false,
  volume: 0.8,
  repeatMode: 'none', // 'none', 'repeat', 'repeat-one'
  shuffle: false,
  playbackPosition: 0,
  isLoading: false,
  error: null,
};

const musicSlice = createSlice({
  name: 'music',
  initialState,
  reducers: {
    setCurrentTrack: (state, action) => {
      state.currentTrack = action.payload;
      state.playbackPosition = 0;
    },
    setPlaylist: (state, action) => {
      state.playlist = action.payload;
    },
    addToPlaylist: (state, action) => {
      state.playlist.push(action.payload);
    },
    removeFromPlaylist: (state, action) => {
      state.playlist = state.playlist.filter(
        track => track.id !== action.payload,
      );
    },
    play: state => {
      state.isPlaying = true;
    },
    pause: state => {
      state.isPlaying = false;
    },
    togglePlay: state => {
      state.isPlaying = !state.isPlaying;
    },
    setVolume: (state, action) => {
      state.volume = Math.max(0, Math.min(1, action.payload));
    },
    setRepeatMode: (state, action) => {
      state.repeatMode = action.payload;
    },
    toggleShuffle: state => {
      state.shuffle = !state.shuffle;
    },
    setPlaybackPosition: (state, action) => {
      state.playbackPosition = action.payload;
    },
    nextTrack: state => {
      if (state.playlist.length > 0) {
        const currentIndex = state.playlist.findIndex(
          track => track.id === state.currentTrack?.id,
        );
        let nextIndex = currentIndex + 1;
        
        if (state.shuffle) {
          nextIndex = Math.floor(Math.random() * state.playlist.length);
        }
        
        if (nextIndex >= state.playlist.length) {
          if (state.repeatMode === 'repeat') {
            nextIndex = 0;
          } else {
            state.isPlaying = false;
            return;
          }
        }
        
        state.currentTrack = state.playlist[nextIndex];
        state.playbackPosition = 0;
      }
    },
    previousTrack: state => {
      if (state.playlist.length > 0) {
        const currentIndex = state.playlist.findIndex(
          track => track.id === state.currentTrack?.id,
        );
        let prevIndex = currentIndex - 1;
        
        if (state.shuffle) {
          prevIndex = Math.floor(Math.random() * state.playlist.length);
        }
        
        if (prevIndex < 0) {
          if (state.repeatMode === 'repeat') {
            prevIndex = state.playlist.length - 1;
          } else {
            state.isPlaying = false;
            return;
          }
        }
        
        state.currentTrack = state.playlist[prevIndex];
        state.playbackPosition = 0;
      }
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
  setCurrentTrack,
  setPlaylist,
  addToPlaylist,
  removeFromPlaylist,
  play,
  pause,
  togglePlay,
  setVolume,
  setRepeatMode,
  toggleShuffle,
  setPlaybackPosition,
  nextTrack,
  previousTrack,
  setLoading,
  setError,
  clearError,
} = musicSlice.actions;

export default musicSlice.reducer;