"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsController = exports.SettingsController = void 0;
const settings_service_1 = require("./settings.service");
/** Settings controller — handles system configuration management */
class SettingsController {
    /** GET /api/settings */
    async getAllSettings(req, res, next) {
        try {
            const settings = await settings_service_1.settingsService.getAllSettings();
            res.json({ success: true, data: settings });
        }
        catch (error) {
            next(error);
        }
    }
    /** GET /api/settings/:key */
    async getSetting(req, res, next) {
        try {
            const setting = await settings_service_1.settingsService.getSettingByKey(req.params.key);
            res.json({ success: true, data: setting });
        }
        catch (error) {
            next(error);
        }
    }
    /** POST /api/settings */
    async createSetting(req, res, next) {
        try {
            const { key, value, description } = req.body;
            const setting = await settings_service_1.settingsService.createSetting(key, value, description, req.user.userId);
            res.status(201).json({ success: true, data: setting, message: 'Setting created' });
        }
        catch (error) {
            next(error);
        }
    }
    /** PUT /api/settings/:key */
    async updateSetting(req, res, next) {
        try {
            const { value } = req.body;
            const setting = await settings_service_1.settingsService.updateSetting(req.params.key, value, req.user.userId);
            res.json({ success: true, data: setting, message: 'Setting updated' });
        }
        catch (error) {
            next(error);
        }
    }
    /** DELETE /api/settings/:key */
    async deleteSetting(req, res, next) {
        try {
            await settings_service_1.settingsService.deleteSetting(req.params.key);
            res.json({ success: true, message: 'Setting deleted' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SettingsController = SettingsController;
exports.settingsController = new SettingsController();
//# sourceMappingURL=settings.controller.js.map