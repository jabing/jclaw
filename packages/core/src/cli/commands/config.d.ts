/**
 * jclaw config command - Configuration management
 *
 * Phase 1: Basic stub implementation
 */
export interface ConfigOptions {
    key?: string;
    value?: string;
}
declare const DEFAULT_CONFIG: Record<string, string | number | boolean>;
export declare function configCommand(args: string[]): Promise<void>;
export declare function getConfig(): Record<string, string | number | boolean>;
export declare function setConfigValue(key: string, value: string | number | boolean): void;
export declare function showConfigHelp(): void;
export { DEFAULT_CONFIG };
//# sourceMappingURL=config.d.ts.map