import { SystemConfig } from '../../shared/types';
/**
 * Settings service — CRUD operations for system configurations.
 * Stores AskBox settings like welcome message, supported languages,
 * OpenAI parameters (temperature, max_tokens), and system prompts.
 */
export declare class SettingsService {
    /** Get all system configurations */
    getAllSettings(): Promise<SystemConfig[]>;
    /** Get a single setting by key */
    getSettingByKey(key: string): Promise<SystemConfig>;
    /** Create a new setting */
    createSetting(key: string, value: unknown, description: string, updatedBy: string): Promise<SystemConfig>;
    /** Update an existing setting */
    updateSetting(key: string, value: unknown, updatedBy: string): Promise<SystemConfig>;
    /** Delete a setting */
    deleteSetting(key: string): Promise<void>;
    private mapRow;
}
export declare const settingsService: SettingsService;
//# sourceMappingURL=settings.service.d.ts.map