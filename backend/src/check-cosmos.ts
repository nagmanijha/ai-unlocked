import { CosmosClient } from '@azure/cosmos';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
    console.log('No cosmos credentials.');
    process.exit(1);
}

const client = new CosmosClient({ endpoint, key });
const db = client.database(process.env.COSMOS_DATABASE || 'askbox-db');
const container = db.container(process.env.COSMOS_CONTAINER || 'calls');

async function check() {
    try {
        const result = await container.items.query("SELECT * FROM c OFFSET 0 LIMIT 10").fetchAll();
        fs.writeFileSync('cosmos-data.json', JSON.stringify(result.resources, null, 2), 'utf-8');
        console.log('Written to cosmos-data.json');
    } catch (e) {
        console.error('Error in query', e);
    }
}
check();
