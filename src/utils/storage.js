/**
 * storage.js - MMKV storage instance (default export)
 * Compatible alias for storageUtils
 */
import { MMKV } from 'react-native-mmkv';

// MMKV 瀹炰緥 (default export for backward compat)
const mmkvStorage = new MMKV();

export default mmkvStorage;

// Re-export all named exports from storageUtils
export * from './storageUtils';