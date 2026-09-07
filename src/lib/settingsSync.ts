import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { useMarketStore } from '../store/useMarketStore';

export type SyncStatus = 'idle' | 'saving' | 'synced' | 'error';

type SyncListener = (status: SyncStatus, lastSyncedAt: Date | null) => void;
const listeners = new Set<SyncListener>();

let currentSyncStatus: SyncStatus = 'idle';
let lastSyncedAt: Date | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isApplyingRemoteSettings = false;

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
 * Loads user settings from Firestore account and applies them across the application.
 */
export async function loadUserSettingsFromCloud(userId: string): Promise<boolean> {
  if (!userId) return false;

  // Handle Demo accounts with local storage fallback
  if (userId.startsWith('demo-trader-')) {
    try {
      const demoData = localStorage.getItem('otivo_demo_user_settings');
      if (demoData) {
        const parsed = JSON.parse(demoData);
        applyRemoteSettingsToStore(parsed);
        currentSyncStatus = 'synced';
        lastSyncedAt = new Date();
        notifyListeners();
        return true;
      }
    } catch {}
    return false;
  }

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
 * Saves current store settings to Firestore.
 */
export async function saveUserSettingsToCloud(userId: string, immediate = false): Promise<void> {
  if (!userId) return;

  if (userId.startsWith('demo-trader-')) {
    try {
      const payload = {
        ...extractStoreSettings(),
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

    const path = `users/${userId}/settings/preferences`;
    try {
      const payload = {
        ...extractStoreSettings(),
        userId,
        updatedAt: new Date().toISOString()
      };

      const settingsDocRef = doc(db, 'users', userId, 'settings', 'preferences');
      await setDoc(settingsDocRef, payload, { merge: true });

      currentSyncStatus = 'synced';
      lastSyncedAt = new Date();
      notifyListeners();
    } catch (err: any) {
      console.warn('Could not save settings to cloud (will retry on next change):', err);
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
    }, 1200); // 1.2s debounce to throttle user dragging/drawing/toggling
  }
}

/**
 * Initializes automatic sync binding for authenticated users.
 */
export function initSettingsSync(getUserId: () => string | null | undefined) {
  // Subscribe to changes in the market store
  const unsubscribe = useMarketStore.subscribe((state, prevState) => {
    if (isApplyingRemoteSettings) return;

    const userId = getUserId();
    if (!userId) return;

    // Check if any tracked setting actually changed
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
      state.activePanel !== prevState.activePanel;

    if (settingsChanged) {
      saveUserSettingsToCloud(userId, false);
    }
  });

  return unsubscribe;
}
