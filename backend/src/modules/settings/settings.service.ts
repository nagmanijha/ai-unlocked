import { pool } from '../../database/connection';
import { SystemConfig } from '../../shared/types';
import { NotFoundError, ConflictError } from '../../shared/errors';

/**
 * Settings service — CRUD operations for system configurations.
 * Stores AskBox settings like welcome message, supported languages,
 * OpenAI parameters (temperature, max_tokens), and system prompts.
 */
export class SettingsService {
    /** Get all system configurations */
    async getAllSettings(): Promise<SystemConfig[]> {
        const result = await pool.query(
            'SELECT * FROM system_configurations ORDER BY key ASC'
        );
        return result.rows.map(this.mapRow);
    }

    /** Get a single setting by key */
    async getSettingByKey(key: string): Promise<SystemConfig> {
        const result = await pool.query(
            'SELECT * FROM system_configurations WHERE key = $1',
            [key]
        );
        if (result.rows.length === 0) {
            throw new NotFoundError(`Setting "${key}" not found`);
        }
        return this.mapRow(result.rows[0]);
    }

    /** Create a new setting */
    async createSetting(
        key: string,
        value: unknown,
        description: string,
        updatedBy: string
    ): Promise<SystemConfig> {
        const existing = await pool.query(
            'SELECT id FROM system_configurations WHERE key = $1',
            [key]
        );
        if (existing.rows.length > 0) {
            throw new ConflictError(`Setting "${key}" already exists`);
        }

        const result = await pool.query(
            `INSERT INTO system_configurations (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
            [key, JSON.stringify(value), description, updatedBy]
        );
        return this.mapRow(result.rows[0]);
    }

    /** Update an existing setting */
    async updateSetting(
        key: string,
        value: unknown,
        updatedBy: string
    ): Promise<SystemConfig> {
        const result = await pool.query(
            `UPDATE system_configurations
       SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3 RETURNING *`,
            [JSON.stringify(value), updatedBy, key]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError(`Setting "${key}" not found`);
        }
        return this.mapRow(result.rows[0]);
    }

    /** Delete a setting */
    async deleteSetting(key: string): Promise<void> {
        const result = await pool.query(
            'DELETE FROM system_configurations WHERE key = $1',
            [key]
        );
        if (result.rowCount === 0) {
            throw new NotFoundError(`Setting "${key}" not found`);
        }
    }

    private mapRow(row: any): SystemConfig {
        return {
            id: row.id,
            key: row.key,
            value: row.value,
            description: row.description,
            updatedBy: row.updated_by,
            updatedAt: row.updated_at,
        };
    }
}

export const settingsService = new SettingsService();
