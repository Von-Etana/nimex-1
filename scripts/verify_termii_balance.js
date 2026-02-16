import axios from 'axios';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from functions/.env
const envPath = path.resolve(__dirname, '../functions/.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    process.exit(1);
}

const API_KEY = process.env.TERMII_API_KEY;
const BASE_URL = process.env.TERMII_BASE_URL || 'https://v3.api.termii.com';

if (!API_KEY) {
    console.error('TERMII_API_KEY not found in .env');
    process.exit(1);
}

async function checkBalance() {
    console.log('Verifying Termii API Key...');
    console.log(`Base URL: ${BASE_URL}`);
    // Hide key in logs
    console.log(`API Key: ${API_KEY.substring(0, 5)}...${API_KEY.substring(API_KEY.length - 5)}`);

    try {
        const response = await axios.get(`${BASE_URL}/api/get-balance?api_key=${API_KEY}`);

        if (response.data) {
            console.log('\n✅ Termii API Key is VALID.');
            console.log('Balance:', response.data);
        } else {
            console.log('\n⚠️ Unexpected response format:', response.data);
        }
    } catch (error) {
        console.error('\n❌ Failed to verify Termii API Key.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

checkBalance();
