import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, set, get, update, onValue, off } from 'firebase/database';
import { db, rtdb, auth, handleFirestoreError, OperationType } from './firebase';
import { useMarketStore } from '../store/useMarketStore';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'error';

type SyncListener = (status: SyncStatus, lastSyncedAt: Date | null) => void;
const listeners = new Set<SyncListener>();

let currentSyncStatus: SyncStatus = 'idle';
let lastSyncedAt: Date | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteSettings = false;
let activeRTDBUnsubscribe: (() => void) | null = null;

function notifyListeners() {
  listeners.forEach((fn) => fn(currentSyncStatus, lastSyncedAt));
}

export function subscribeToSyncStatus(listener: SyncListener) {
  listeners.add(listener);
  listener(currentSyncStatus, lastSyncedAt);
  return () => {
    listeners.delete(listener);
  };
}

export function getSyncStatus() {
  return { status: currentSyncStatus, lastSyncedAt };
}

/**
 * Extracts pure, serializable user settings from store state.
 */
export function extractStoreSettings() {
  const s = useMarketStore.getState();
  return {
    theme: s.theme,
    activeSymbol: s.activeSymbol,
    activeTimeframe: s.activeTimeframe,
    chartType: s.chartType,
    activeIndicators: s.activeIndicators || [],
    hiddenIndicators: s.hiddenIndicators || [],
    savedScripts: s.savedScripts || [],
    chartSettings: s.chartSettings,
    drawings: s.drawings || [],
    alerts: s.alerts || [],
    savedLayouts: s.savedLayouts || [],
    currentLayoutName: s.currentLayoutName || 'Default Layout',
    multiLayout: s.multiLayout || '1',
    taTimeframe: s.taTimeframe || '15m',
    pivotMode: s.pivotMode || 'classic',
    activePanel: s.activePanel || null,
  };
}

/**
 * Loads user settings and watchlist from Realtime Database and Firestore accounts.
 */
export async function loadUserSettingsFromCloud(userId: string): Promise<boolean> {
  if (!userId) return false;

  // Handle Demo accounts with local storage fallback
  if (userId.startsWith('demo-trader-')) {
    try {
      const demoData = localStorage.getItem('otivo_demo_user_settings');
      if (demoData) {
        const parsed = JSON.parse(demoData);
        applyRemoteSettingsToStore(parsed.settings || parsed);
        if (Array.isArray(parsed.watchlist)) {
          useMarketStore.getState().setWatchlist(parsed.watchlist);
        }
        currentSyncStatus = 'synced';
        lastSyncedAt = new Date();
        notifyListeners();
        return true;
      }
    } catch {}
    return false;
  }

  // 1. First attempt fast fetch from Firebase Realtime Database
  try {
    const userRtdbRef = ref(rtdb, `users/${userId}`);
    const rtdbSnap = await get(userRtdbRef);
    if (rtdbSnap.exists()) {
      const rtdbData = rtdbSnap.val();
      if (rtdbData.settings) {
        applyRemoteSettingsToStore(rtdbData.settings);
      }
      if (Array.isArray(rtdbData.watchlist) && rtdbData.watchlist.length > 0) {
        useMarketStore.getState().setWatchlist(rtdbData.watchlist);
      }
      currentSyncStatus = 'synced';
      lastSyncedAt = rtdbData.updatedAt ? new Date(rtdbData.updatedAt) : new Date();
      notifyListeners();
      return true;
    }
  } catch (rtdbErr) {
    console.warn('Realtime Database initial load notice:', rtdbErr);
  }

  // 2. Fallback to Firestore
  const path = `users/${userId}/settings/preferences`;
  try {
    const settingsDocRef = doc(db, 'users', userId, 'settings', 'preferences');
    const snap = await getDoc(settingsDocRef);

    if (snap.exists()) {
      const data = snap.data();
      applyRemoteSettingsToStore(data);
      currentSyncStatus = 'synced';
      lastSyncedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      notifyListeners();
      return true;
    } else {
      // First login on this account: persist current defaults as starting snapshot
      await saveUserSettingsToCloud(userId, true);
      return true;
    }
  } catch (error) {
    console.warn('Could not retrieve cloud settings from Firestore (offline or initial connection):', error);
    currentSyncStatus = 'idle';
    notifyListeners();
    return false;
  }
}

/**
 * Safely applies fetched settings into Zustand store and document root.
 */
function applyRemoteSettingsToStore(data: any) {
  if (!data) return;
  isApplyingRemoteSettings = true;

  try {
    const updates: Record<string, any> = {};

    if (data.theme && (data.theme === 'dark' || data.theme === 'light')) {
      updates.theme = data.theme;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', data.theme === 'dark');
      }
    }

    if (data.activeSymbol && typeof data.activeSymbol === 'string') {
      updates.activeSymbol = data.activeSymbol;
    }

    if (data.activeTimeframe && typeof data.activeTimeframe === 'string') {
      updates.activeTimeframe = data.activeTimeframe;
    }

    if (data.chartType && typeof data.chartType === 'string') {
      updates.chartType = data.chartType;
    }

    if (Array.isArray(data.activeIndicators)) {
      updates.activeIndicators = data.activeIndicators;
    }

    if (Array.isArray(data.hiddenIndicators)) {
      updates.hiddenIndicators = data.hiddenIndicators;
    }

    if (Array.isArray(data.savedScripts)) {
      updates.savedScripts = data.savedScripts;
    }

    if (data.chartSettings && typeof data.chartSettings === 'object') {
      updates.chartSettings = {
        ...useMarketStore.getState().chartSettings,
        ...data.chartSettings
      };
    }

    if (Array.isArray(data.drawings)) {
      updates.drawings = data.drawings;
    }

    if (Array.isArray(data.alerts)) {
      updates.alerts = data.alerts;
    }

    if (Array.isArray(data.savedLayouts)) {
      updates.savedLayouts = data.savedLayouts;
    }

    if (data.currentLayoutName && typeof data.currentLayoutName === 'string') {
      updates.currentLayoutName = data.currentLayoutName;
    }

    if (data.multiLayout && typeof data.multiLayout === 'string') {
      updates.multiLayout = data.multiLayout;
    }

    if (data.taTimeframe && typeof data.taTimeframe === 'string') {
      updates.taTimeframe = data.taTimeframe;
    }

    if (data.pivotMode && typeof data.pivotMode === 'string') {
      updates.pivotMode = data.pivotMode;
    }

    if (data.activePanel !== undefined) {
      updates.activePanel = data.activePanel;
    }

    useMarketStore.setState(updates);
  } finally {
    // Release debounce lock after brief tick
    setTimeout(() => {
      isApplyingRemoteSettings = false;
    }, 250);
  }
}

/**
 * Saves current store settings and watchlist to Realtime Database and Firestore.
 */
export async function saveUserSettingsToCloud(userId: string, immediate = false): Promise<void> {
  if (!userId) return;

  if (userId.startsWith('demo-trader-')) {
    try {
      const payload = {
        settings: extractStoreSettings(),
        watchlist: useMarketStore.getState().watchlist || [],
        userId,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('otivo_demo_user_settings', JSON.stringify(payload));
      currentSyncStatus = 'synced';
      lastSyncedAt = new Date();
      notifyListeners();
    } catch {}
    return;
  }

  const doSave = async () => {
    currentSyncStatus = 'saving';
    notifyListeners();

    const timestamp = new Date().toISOString();
    const currentSettings = extractStoreSettings();
    const currentWatchlist = useMarketStore.getState().watchlist || [];
    const currentUser = auth.currentUser;

    // 1. Save to Firebase Realtime Database (matching schema under /users/<USER_UID>/)
    try {
      const userRtdbRef = ref(rtdb, `users/${userId}`);
      const rtdbPayload: Record<string, any> = {
        watchlist: currentWatchlist,
        settings: currentSettings,
        updatedAt: timestamp
      };
      if (currentUser?.email) rtdbPayload.email = currentUser.email;
      if (currentUser?.displayName) rtdbPayload.displayName = currentUser.displayName;

      await update(userRtdbRef, rtdbPayload);
    } catch (rtdbErr) {
      console.warn('Realtime Database background sync warning:', rtdbErr);
    }

    // 2. Save to Firestore preferences collection
    const path = `users/${userId}/settings/preferences`;
    try {
      const payload = {
        ...currentSettings,
        watchlist: currentWatchlist,
        userId,
        updatedAt: timestamp
      };

      const settingsDocRef = doc(db, 'users', userId, 'settings', 'preferences');
      await setDoc(settingsDocRef, payload, { merge: true });

      currentSyncStatus = 'synced';
      lastSyncedAt = new Date();
      notifyListeners();
    } catch (err: any) {
      console.warn('Could not save settings to Firestore (will retry on next change):', err);
      currentSyncStatus = 'error';
      notifyListeners();
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  };

  if (immediate) {
    if (debounceTimer) clearTimeout(debounceTimer);
    await doSave();
  } else {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      doSave();
    }, 1000); // 1.0s debounce
  }
}

/**
 * Initializes automatic sync binding and real-time listeners for authenticated users.
 */
export function initSettingsSync(getUserId: () => string | null | undefined) {
  // Clear any existing RTDB listener
  if (activeRTDBUnsubscribe) {
    activeRTDBUnsubscribe();
    activeRTDBUnsubscribe = null;
  }

  const userId = getUserId();
  if (userId && !userId.startsWith('demo-trader-')) {
    try {
      const userRtdbRef = ref(rtdb, `users/${userId}`);
      const unsub = onValue(userRtdbRef, (snapshot) => {
        if (!snapshot.exists()) return;
        if (isApplyingRemoteSettings) return;

        const remoteData = snapshot.val();
        if (remoteData) {
          if (remoteData.settings) {
            applyRemoteSettingsToStore(remoteData.settings);
          }
          if (Array.isArray(remoteData.watchlist)) {
            const currentWatchlist = useMarketStore.getState().watchlist;
            if (JSON.stringify(currentWatchlist) !== JSON.stringify(remoteData.watchlist)) {
              useMarketStore.getState().setWatchlist(remoteData.watchlist);
            }
          }
        }
      });

      activeRTDBUnsubscribe = () => {
        off(userRtdbRef, 'value', unsub);
      };
    } catch (err) {
      console.warn('Could not initialize Realtime Database live listener:', err);
    }
  }

  // Subscribe to changes in the market store to push updates to cloud
  const unsubscribeStore = useMarketStore.subscribe((state, prevState) => {
    if (isApplyingRemoteSettings) return;

    const currentUid = getUserId();
    if (!currentUid) return;

    // Check if any tracked setting or watchlist actually changed
    const settingsChanged = 
      state.theme !== prevState.theme ||
      state.activeSymbol !== prevState.activeSymbol ||
      state.activeTimeframe !== prevState.activeTimeframe ||
      state.chartType !== prevState.chartType ||
      state.activeIndicators !== prevState.activeIndicators ||
      state.hiddenIndicators !== prevState.hiddenIndicators ||
      state.savedScripts !== prevState.savedScripts ||
      state.chartSettings !== prevState.chartSettings ||
      state.drawings !== prevState.drawings ||
      state.alerts !== prevState.alerts ||
      state.savedLayouts !== prevState.savedLayouts ||
      state.currentLayoutName !== prevState.currentLayoutName ||
      state.multiLayout !== prevState.multiLayout ||
      state.taTimeframe !== prevState.taTimeframe ||
      state.pivotMode !== prevState.pivotMode ||
      state.activePanel !== prevState.activePanel ||
      state.watchlist !== prevState.watchlist;

    if (settingsChanged) {
      saveUserSettingsToCloud(currentUid, false);
    }
  });

  return () => {
    unsubscribeStore();
    if (activeRTDBUnsubscribe) {
      activeRTDBUnsubscribe();
      activeRTDBUnsubscribe = null;
    }
  };
}
