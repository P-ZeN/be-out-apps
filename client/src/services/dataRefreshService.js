/**
 * Enhanced Data Refresh Service
 * Manages data refresh indicators and status across the app
 */

import React, { useState, useCallback } from 'react';

class DataRefreshService {
    constructor() {
        this.listeners = new Set();
        this.refreshState = {
            isRefreshing: false,
            lastRefreshTime: null,
            refreshCount: 0
        };
    }

    /**
     * Add a refresh listener
     */
    addListener(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of refresh state change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.refreshState);
            } catch (error) {
                console.error('[DATA_REFRESH] Error in listener callback:', error);
            }
        });
    }

    /**
     * Start refresh
     */
    startRefresh() {
        this.refreshState.isRefreshing = true;
        this.refreshState.refreshCount++;
        console.log(`[DATA_REFRESH] Refresh started (#${this.refreshState.refreshCount})`);
        this.notifyListeners();
    }

    /**
     * End refresh
     */
    endRefresh() {
        this.refreshState.isRefreshing = false;
        this.refreshState.lastRefreshTime = new Date();
        console.log('[DATA_REFRESH] Refresh completed');
        this.notifyListeners();
    }

    /**
     * Get current refresh state
     */
    getRefreshState() {
        return { ...this.refreshState };
    }

    /**
     * Check if recently refreshed (within last 30 seconds)
     */
    isRecentlyRefreshed() {
        if (!this.refreshState.lastRefreshTime) return false;
        const thirtySecondsAgo = new Date(Date.now() - 30000);
        return this.refreshState.lastRefreshTime > thirtySecondsAgo;
    }
}

// Create singleton instance
const dataRefreshService = new DataRefreshService();

/**
 * React hook for using data refresh service
 */
export const useDataRefresh = () => {
    const [refreshState, setRefreshState] = useState(dataRefreshService.getRefreshState());

    const handleRefreshStateChange = useCallback((newState) => {
        setRefreshState(newState);
    }, []);

    // Subscribe to refresh state changes
    React.useEffect(() => {
        const unsubscribe = dataRefreshService.addListener(handleRefreshStateChange);
        return unsubscribe;
    }, [handleRefreshStateChange]);

    const startRefresh = useCallback(() => {
        dataRefreshService.startRefresh();
    }, []);

    const endRefresh = useCallback(() => {
        dataRefreshService.endRefresh();
    }, []);

    return {
        refreshState,
        startRefresh,
        endRefresh,
        isRefreshing: refreshState.isRefreshing,
        lastRefreshTime: refreshState.lastRefreshTime,
        isRecentlyRefreshed: dataRefreshService.isRecentlyRefreshed()
    };
};

export default dataRefreshService;
