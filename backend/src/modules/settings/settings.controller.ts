import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { ApiResponse } from '../../shared/types';

/** Settings controller — handles system configuration management */
export class SettingsController {
    /** GET /api/settings */
    async getAllSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const settings = await settingsService.getAllSettings();
            res.json({ success: true, data: settings } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** GET /api/settings/:key */
    async getSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const setting = await settingsService.getSettingByKey(req.params.key);
            res.json({ success: true, data: setting } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** POST /api/settings */
    async createSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { key, value, description } = req.body;
            const setting = await settingsService.createSetting(key, value, description, req.user!.userId);
            res.status(201).json({ success: true, data: setting, message: 'Setting created' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** PUT /api/settings/:key */
    async updateSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { value } = req.body;
            const setting = await settingsService.updateSetting(req.params.key, value, req.user!.userId);
            res.json({ success: true, data: setting, message: 'Setting updated' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }

    /** DELETE /api/settings/:key */
    async deleteSetting(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            await settingsService.deleteSetting(req.params.key);
            res.json({ success: true, message: 'Setting deleted' } as ApiResponse);
        } catch (error) {
            next(error);
        }
    }
}

export const settingsController = new SettingsController();
