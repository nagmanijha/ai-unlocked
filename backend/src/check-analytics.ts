import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const client = new CosmosClient({ endpoint: process.env.COSMOS_ENDPOINT, key: process.env.COSMOS_KEY });
const db = client.database(process.env.COSMOS_DATABASE || 'askbox-db');
const container = db.container(process.env.COSMOS_CONTAINER || 'calls');

async function check() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Querying for type='call_log' and startedAt >= '${today}'`);
        const result = await container.items.query(`SELECT VALUE COUNT(1) FROM c WHERE c.type = 'call_log' AND c.startedAt >= '${today}'`).fetchAll();
        console.log('Count:', result.resources[0]);

        const allCallLogs = await container.items.query(`SELECT * FROM c WHERE c.type = 'call_log'`).fetchAll();
        console.log('All call_log documents length:', allCallLogs.resources.length);
        if (allCallLogs.resources.length > 0) {
            console.log('Sample format:', JSON.stringify(allCallLogs.resources[0], null, 2));
        } else {
            console.log('NO call_log FORMAT DOCUMENTS FOUND!');
        }
    } catch(e) {
        console.error('Error in query', e);
    }
}
check();
