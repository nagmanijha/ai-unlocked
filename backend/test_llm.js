require('dotenv').config();

const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

async function testAzure() {
    console.log(`\n🔍 Checking Azure OpenAI Configuration...`);
    console.log(`Endpoint:   ${endpoint}`);
    console.log(`Deployment: ${deployment}`);

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
    console.log(`Constructed URL: ${url}\n`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Say hello in one word' }],
                max_tokens: 10
            })
        });

        const data = await res.json();
        
        if (res.ok) {
            console.log(`✅ SUCCESS! The AI replied: ${data.choices[0].message.content}`);
        } else {
            console.error(`❌ FAILED! Error from Azure:`);
            console.error(JSON.stringify(data.error, null, 2));
            
            if (data.error?.code === 'DeploymentNotFound') {
                console.log(`\n💡 FIX IMPLEMENTATION:\nYour deployment name '${deployment}' does not physically exist in this resource.\nGo to oai.azure.com -> Deployments -> Find the exact name in the "Deployment name" column and update your .env AZURE_OPENAI_DEPLOYMENT.`);
            }
        }
    } catch (err) {
        console.error(`Network or fetch error:`, err);
    }
}

testAzure();
