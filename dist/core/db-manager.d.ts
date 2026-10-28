/**
 * db-manager - Master Orchestrator Class
 */
import { UniversalEventEmitter } from './events';
import { DbManagerConfig } from './config';
import { IRemoteAdapter } from '../remote/remote-adapter.interface';
import { Collection } from './collection';
import { SyncStats } from './types';
export declare class DbManager extends UniversalEventEmitter {
    readonly dbName: string;
    private local;
    private remote?;
    private syncEngine?;
    private queue;
    private collections;
    private isInitialized;
    constructor(config?: DbManagerConfig);
    private forwardEvents;
    /**
     * Initializes local storage and starts sync background listeners
     */
    init(): Promise<DbManager>;
    /**
     * Sets or switches the remote adapter at runtime
     */
    setRemote(remote: IRemoteAdapter): Promise<void>;
    /**
     * Returns a type-safe collection accessor
     */
    collection<T = Record<string, any>>(name: string): Collection<T>;
    /**
     * Manually triggers an immediate synchronization cycle
     */
    sync(): Promise<SyncStats>;
    /**
     * Returns active sync stats and pending mutation count
     */
    getSyncStats(): Promise<SyncStats>;
    /**
     * Checks whether internet connectivity is currently established
     */
    isOnline(): boolean;
    /**
     * Cleanly closes connections and background timers
     */
    close(): Promise<void>;
    get patients(): Collection<Record<string, any>>;
    get doctors(): Collection<Record<string, any>>;
    get appointments(): Collection<Record<string, any>>;
    get prescriptions(): Collection<Record<string, any>>;
    get invoices(): Collection<Record<string, any>>;
    get medicalRecords(): Collection<Record<string, any>>;
    get clinics(): Collection<Record<string, any>>;
    get users(): Collection<Record<string, any>>;
    get activityLogs(): Collection<Record<string, any>>;
    get keyValue(): Collection<Record<string, any>>;
    get generic(): Collection<Record<string, any>>;
}
//# sourceMappingURL=db-manager.d.ts.map