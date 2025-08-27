#!/usr/bin/env node

/**
 * Typeform Setup Script
 * 
 * This script helps you set up the Typeform integration by:
 * 1. Testing your Typeform API connection
 * 2. Setting up webhooks
 * 3. Verifying the integration
 */

const axios = require('axios');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const config = {
  baseUrl: process.env.TYPEFORM_EU_DATA_CENTER === 'true' 
    ? 'https://api.eu.typeform.com' 
    : 'https://api.typeform.com',
  token: process.env.TYPEFORM_PERSONAL_ACCESS_TOKEN,
  formId: process.env.TYPEFORM_FORM_ID,
  webhookSecret: process.env.TYPEFORM_WEBHOOK_SECRET
};

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function testConnection() {
  console.log('\n🔍 Testing Typeform API connection...');
  
  if (!config.token) {
    console.error('❌ TYPEFORM_PERSONAL_ACCESS_TOKEN not found in environment variables');
    return false;
  }

  if (!config.formId) {
    console.error('❌ TYPEFORM_FORM_ID not found in environment variables');
    return false;
  }

  try {
    const response = await axios.get(`${config.baseUrl}/forms/${config.formId}`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Successfully connected to Typeform API');
    console.log(`📋 Form title: ${response.data.title}`);
    console.log(`🔗 Form URL: https://form.typeform.com/to/${config.formId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Typeform API');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Message: ${error.response.data?.message || 'Unknown error'}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    return false;
  }
}

async function checkWebhook() {
  console.log('\n🔍 Checking existing webhook...');
  
  try {
    const response = await axios.get(`${config.baseUrl}/forms/${config.formId}/webhooks/webhook-tag`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook already exists');
    console.log(`🔗 URL: ${response.data.url}`);
    console.log(`📊 Enabled: ${response.data.enabled}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️  No webhook configured yet');
      return null;
    } else {
      console.error('❌ Error checking webhook:', error.response?.data || error.message);
      return null;
    }
  }
}

async function setupWebhook() {
  console.log('\n🔧 Setting up webhook...');
  
  const webhookUrl = await question('Enter your webhook URL (e.g., https://yourdomain.com/api/personality-test/webhook): ');
  
  if (!webhookUrl.includes('personality-test/webhook')) {
    console.log('⚠️  Warning: URL doesn\'t contain expected path');
    const confirm = await question('Continue anyway? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      return false;
    }
  }

  try {
    const response = await axios.put(`${config.baseUrl}/forms/${config.formId}/webhooks/webhook-tag`, {
      url: webhookUrl,
      enabled: true
    }, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook created successfully');
    console.log(`🔗 URL: ${response.data.url}`);
    console.log(`📊 Enabled: ${response.data.enabled}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create webhook');
    console.error(error.response?.data || error.message);
    return false;
  }
}

async function testWebhook() {
  console.log('\n🧪 Testing webhook...');
  console.log('Please submit a test response to your Typeform to test the webhook integration.');
  console.log('Make sure to include the following hidden fields:');
  console.log('- user_id: A valid MongoDB user ID from your database');
  console.log('- first_name: Test first name');
  console.log('- last_name: Test last name');
  console.log('- email: Test email');
  console.log('- phone_number: Test phone number');
  
  const testUrl = `https://form.typeform.com/to/${config.formId}?typeform-source=setup-script&user_id=TEST_USER_ID&first_name=Test&last_name=User&email=test@example.com&phone_number=+1234567890`;
  console.log(`\n🔗 Test URL: ${testUrl}`);
  
  await question('Press Enter after submitting the test response...');
  console.log('Check your server logs to see if the webhook was received successfully.');
}

async function getResponses() {
  console.log('\n📊 Fetching recent responses...');
  
  try {
    const response = await axios.get(`${config.baseUrl}/forms/${config.formId}/responses`, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      },
      params: {
        page_size: 5,
        completed: true
      }
    });

    console.log(`✅ Found ${response.data.total_items} total responses`);
    console.log(`📋 Recent responses (showing up to 5):`);
    
    response.data.items.forEach((item, index) => {
      console.log(`  ${index + 1}. Token: ${item.token}`);
      console.log(`     Submitted: ${item.submitted_at}`);
      console.log(`     User ID: ${item.hidden?.user_id || 'N/A'}`);
      console.log(`     Name: ${item.hidden?.first_name || 'N/A'} ${item.hidden?.last_name || 'N/A'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to fetch responses');
    console.error(error.response?.data || error.message);
  }
}

async function main() {
  console.log('🚀 Typeform Integration Setup Script');
  console.log('====================================\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ Please fix the connection issues before continuing.');
    rl.close();
    return;
  }

  // Check webhook
  await checkWebhook();

  console.log('\n📋 What would you like to do?');
  console.log('1. Set up webhook');
  console.log('2. Test webhook');
  console.log('3. View recent responses');
  console.log('4. Exit');

  const choice = await question('\nEnter your choice (1-4): ');

  switch (choice) {
    case '1':
      await setupWebhook();
      break;
    case '2':
      await testWebhook();
      break;
    case '3':
      await getResponses();
      break;
    case '4':
      console.log('👋 Goodbye!');
      break;
    default:
      console.log('❌ Invalid choice');
  }

  rl.close();
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  rl.close();
  process.exit(1);
});

// Run the script
main().catch(console.error);
