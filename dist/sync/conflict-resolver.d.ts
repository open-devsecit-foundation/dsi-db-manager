/**
 * db-manager - High-Precision Millisecond Conflict Resolver
 */
import { ConflictContext, ConflictResolution, ConflictStrategy, CustomConflictResolver } from '../core/types';
export declare class ConflictResolver {
    private strategy;
    private customResolver?;
    constructor(options?: {
        strategy?: ConflictStrategy;
        customResolver?: CustomConflictResolver;
    });
    setStrategy(strategy: ConflictStrategy): void;
    setCustomResolver(resolver: CustomConflictResolver): void;
    /**
     * Resolves a conflict between a local record and a remote record
     */
    resolve<T = any>(context: ConflictContext<T>): Promise<ConflictResolution<T>>;
    /**
     * Field-level merge: takes the newer field values and avoids overwriting unchanged fields
     */
    private mergeFields;
}
//# sourceMappingURL=conflict-resolver.d.ts.map