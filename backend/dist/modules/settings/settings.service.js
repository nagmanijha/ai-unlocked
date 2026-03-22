"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = exports.SettingsService = void 0;
const connection_1 = require("../../database/connection");
const errors_1 = require("../../shared/errors");
/**
 * Settings service — CRUD operations for system configurations.
 * Stores AskBox settings like welcome message, supported languages,
 * OpenAI parameters (temperature, max_tokens), and system prompts.
 */
class SettingsService {
    /** Get all system configurations */
    async getAllSettings() {
        const result = await connection_1.pool.query('SELECT * FROM system_configurations ORDER BY key ASC');
        return result.rows.map(this.mapRow);
    }
    /** Get a single setting by key */
    async getSettingByKey(key) {
        const result = await connection_1.pool.query('SELECT * FROM system_configurations WHERE key = $1', [key]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Setting "${key}" not found`);
        }
        return this.mapRow(result.rows[0]);
    }
    /** Create a new setting */
    async createSetting(key, value, description, updatedBy) {
        const existing = await connection_1.pool.query('SELECT id FROM system_configurations WHERE key = $1', [key]);
        if (existing.rows.length > 0) {
            throw new errors_1.ConflictError(`Setting "${key}" already exists`);
        }
        const result = await connection_1.pool.query(`INSERT INTO system_configurations (key, value, description, updated_by)
       VALUES ($1, $2, $3, $4) RETURNING *`, [key, JSON.stringify(value), description, updatedBy]);
        return this.mapRow(result.rows[0]);
    }
    /** Update an existing setting */
    async updateSetting(key, value, updatedBy) {
        const result = await connection_1.pool.query(`UPDATE system_configurations
       SET value = $1, updated_by = $2, updated_at = NOW()
       WHERE key = $3 RETURNING *`, [JSON.stringify(value), updatedBy, key]);
        if (result.rows.length === 0) {
            throw new errors_1.NotFoundError(`Setting "${key}" not found`);
        }
        return this.mapRow(result.rows[0]);
    }
    /** Delete a setting */
    async deleteSetting(key) {
        const result = await connection_1.pool.query('DELETE FROM system_configurations WHERE key = $1', [key]);
        if (result.rowCount === 0) {
            throw new errors_1.NotFoundError(`Setting "${key}" not found`);
        }
    }
    mapRow(row) {
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
exports.SettingsService = SettingsService;
exports.settingsService = new SettingsService();
//# sourceMappingURL=settings.service.js.map