/**
 * db-manager - Network Connectivity Monitor
 * Combines browser event listeners with active HTTP heartbeat checks.
 */
import { UniversalEventEmitter } from '../core/events';
export declare class NetworkMonitor extends UniversalEventEmitter {
    private isOnlineState;
    private heartbeatIntervalTimer;
    private heartbeatUrl?;
    private pingFn?;
    private checkIntervalMs;
    constructor(options?: {
        heartbeatUrl?: string;
        checkIntervalMs?: number;
        pingFn?: () => Promise<boolean>;
    });
    private init;
    isOnline(): boolean;
    setPingFunction(fn: () => Promise<boolean>): void;
    private handleStateChange;
    /**
     * Actively tests connectivity via pingFn or HTTP fetch
     */
    probe(): Promise<boolean>;
    private startHeartbeat;
    stop(): void;
}
//# sourceMappingURL=network-monitor.d.ts.map