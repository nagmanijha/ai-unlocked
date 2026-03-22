"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const calls_controller_1 = require("./calls.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
// All call routes require authentication
router.use(auth_1.authMiddleware);
router.get('/', (req, res, next) => calls_controller_1.callsController.getCalls(req, res, next));
router.get('/active', (req, res, next) => calls_controller_1.callsController.getActiveCalls(req, res, next));
router.get('/:id', (req, res, next) => calls_controller_1.callsController.getCallById(req, res, next));
exports.default = router;
//# sourceMappingURL=calls.routes.js.map