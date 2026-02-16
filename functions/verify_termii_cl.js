const axios = require('axios');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env in the same directory
const envPath = path.resolve(__dirname, '.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env file:', result.error);
    // Continue anyway, maybe vars are in process?
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
            console.log('Response:', JSON.stringify(response.data, null, 2));
        } else {
            console.log('\n⚠️ Unexpected response format:', response.data);
        }
    } catch (error) {
        console.error('\n❌ Failed to verify Termii API Key.');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

checkBalance();
