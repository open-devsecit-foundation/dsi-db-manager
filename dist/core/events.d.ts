/**
 * db-manager - Universal Event Emitter
 */
export type EventHandler<T = any> = (payload: T) => void | Promise<void>;
export declare class UniversalEventEmitter {
    private listeners;
    on<T = any>(event: string, handler: EventHandler<T>): () => void;
    off<T = any>(event: string, handler: EventHandler<T>): void;
    emit<T = any>(event: string, payload: T): Promise<void>;
    removeAllListeners(event?: string): void;
}
//# sourceMappingURL=events.d.ts.map