"use strict";
/**
 * db-manager - Network Connectivity Monitor
 * Combines browser event listeners with active HTTP heartbeat checks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkMonitor = void 0;
const events_1 = require("../core/events");
class NetworkMonitor extends events_1.UniversalEventEmitter {
    isOnlineState = true;
    heartbeatIntervalTimer = null;
    heartbeatUrl;
    pingFn;
    checkIntervalMs;
    constructor(options) {
        super();
        this.heartbeatUrl = options?.heartbeatUrl;
        this.pingFn = options?.pingFn;
        this.checkIntervalMs = options?.checkIntervalMs || 10000;
        this.init();
    }
    init() {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            this.isOnlineState = navigator.onLine !== undefined ? navigator.onLine : true;
            window.addEventListener('online', () => this.handleStateChange(true));
            window.addEventListener('offline', () => this.handleStateChange(false));
        }
        else {
            // In Node.js / Electron main, default to true until heartbeat probe checks
            this.isOnlineState = true;
        }
        if (this.checkIntervalMs > 0) {
            this.startHeartbeat();
        }
    }
    isOnline() {
        return this.isOnlineState;
    }
    setPingFunction(fn) {
        this.pingFn = fn;
    }
    handleStateChange(newState) {
        if (this.isOnlineState !== newState) {
            this.isOnlineState = newState;
            this.emit(newState ? 'online' : 'offline', { timestamp: Date.now() });
        }
    }
    /**
     * Actively tests connectivity via pingFn or HTTP fetch
     */
    async probe() {
        if (this.pingFn) {
            try {
                const alive = await this.pingFn();
                this.handleStateChange(alive);
                return alive;
            }
            catch {
                this.handleStateChange(false);
                return false;
            }
        }
        if (this.heartbeatUrl) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 4000);
                const res = await fetch(this.heartbeatUrl, {
                    method: 'HEAD',
                    signal: controller.signal,
                    cache: 'no-store',
                });
                clearTimeout(timeout);
                const alive = res.ok || res.status < 500;
                this.handleStateChange(alive);
                return alive;
            }
            catch {
                this.handleStateChange(false);
                return false;
            }
        }
        // Default to navigator.onLine in browser
        if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
            this.handleStateChange(navigator.onLine);
            return navigator.onLine;
        }
        return this.isOnlineState;
    }
    startHeartbeat() {
        if (this.heartbeatIntervalTimer)
            clearInterval(this.heartbeatIntervalTimer);
        this.heartbeatIntervalTimer = setInterval(() => {
            this.probe();
        }, this.checkIntervalMs);
    }
    stop() {
        if (this.heartbeatIntervalTimer) {
            clearInterval(this.heartbeatIntervalTimer);
            this.heartbeatIntervalTimer = null;
        }
        this.removeAllListeners();
    }
}
exports.NetworkMonitor = NetworkMonitor;
//# sourceMappingURL=network-monitor.js.map