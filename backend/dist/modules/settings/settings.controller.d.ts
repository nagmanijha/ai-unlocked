import { Request, Response, NextFunction } from 'express';
/** Settings controller — handles system configuration management */
export declare class SettingsController {
    /** GET /api/settings */
    getAllSettings(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** GET /api/settings/:key */
    getSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** POST /api/settings */
    createSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** PUT /api/settings/:key */
    updateSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
    /** DELETE /api/settings/:key */
    deleteSetting(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const settingsController: SettingsController;
//# sourceMappingURL=settings.controller.d.ts.map