"use strict";
/**
 * db-manager - Universal Event Emitter
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalEventEmitter = void 0;
class UniversalEventEmitter {
    listeners = new Map();
    on(event, handler) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(handler);
        // Return unsubscribe function
        return () => this.off(event, handler);
    }
    off(event, handler) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.listeners.delete(event);
            }
        }
    }
    async emit(event, payload) {
        const handlers = this.listeners.get(event);
        if (!handlers || handlers.size === 0)
            return;
        for (const handler of Array.from(handlers)) {
            try {
                await handler(payload);
            }
            catch (err) {
                console.error(`[db-manager] Error in event handler for "${event}":`, err);
            }
        }
    }
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    }
}
exports.UniversalEventEmitter = UniversalEventEmitter;
//# sourceMappingURL=events.js.map