"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const cosmos_1 = require("@azure/cosmos");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
const client = new cosmos_1.CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
const db = client.database(process.env.COSMOS_DATABASE || 'askbox-db');
const container = db.container(process.env.COSMOS_CONTAINER || 'calls');
async function testInsert() {
    try {
        const docId = `test-log-${Date.now()}`;
        const partitionKey = "demo-call-ui-001";
        const payload = {
            id: docId,
            type: 'call_log',
            phoneNumber: 'unknown',
            language: 'en-IN',
            duration: 30,
            status: 'completed',
            transcriptSummary: 'No transcript',
            transcript: [],
            aiResponses: [],
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
            partitionKey: partitionKey
        };
        console.log("Upserting:", JSON.stringify(payload));
        const res = await container.items.upsert(payload);
        console.log("Success! Status code:", res.statusCode);
        const queryRes = await container.items.query(`SELECT * FROM c WHERE c.id = '${docId}'`).fetchAll();
        console.log("Query check length:", queryRes.resources.length);
    }
    catch (e) {
        console.error('Error:', e.message, e.code, e.stack);
    }
}
testInsert();
//# sourceMappingURL=test-cosmos-upsert.js.map