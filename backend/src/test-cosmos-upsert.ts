import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
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
        
    } catch(e: any) {
        console.error('Error:', e.message, e.code, e.stack);
    }
}
testInsert();
