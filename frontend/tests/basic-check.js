#!/usr/bin/env node

/**
 * Basic Connectivity Check for Replit Environment
 * 
 * This is a simple Node.js script that verifies:
 * 1. Frontend server is running on port 5000
 * 2. Backend server is running on port 8000
 * 3. /setup and /login pages return valid HTML
 * 4. No server crashes or connection errors
 * 
 * This test works in the Replit environment without browser dependencies.
 * 
 * Usage:
 *   node basic-check.js
 */

import http from 'http';

const FRONTEND_URL = 'http://localhost:5000';
const BACKEND_URL = 'http://localhost:8000';

let passedTests = 0;
let failedTests = 0;

function checkUrl(url, testName) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200 && data.length > 0) {
          console.log(`✅ PASS: ${testName}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Content-Length: ${data.length} bytes`);
          passedTests++;
          resolve(true);
        } else {
          console.log(`❌ FAIL: ${testName}`);
          console.log(`   Status: ${res.statusCode}`);
          console.log(`   Content-Length: ${data.length} bytes`);
          failedTests++;
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ FAIL: ${testName}`);
      console.log(`   Error: ${err.message}`);
      failedTests++;
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Basic Connectivity Check - Allajnah Enhanced');
  console.log('═══════════════════════════════════════════════════\n');
  
  console.log('Testing Frontend Server...\n');
  await checkUrl(`${FRONTEND_URL}/setup`, 'Frontend /setup page loads');
  await checkUrl(`${FRONTEND_URL}/login`, 'Frontend /login page loads');
  
  console.log('\nTesting Backend Server...\n');
  await checkUrl(`${BACKEND_URL}/`, 'Backend API is reachable');
  await checkUrl(`${BACKEND_URL}/docs`, 'Backend API docs accessible');
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  ✅ Passed: ${passedTests}`);
  console.log(`  ❌ Failed: ${failedTests}`);
  console.log(`  📊 Total:  ${passedTests + failedTests}`);
  console.log('═══════════════════════════════════════════════════\n');
  
  if (failedTests === 0) {
    console.log('🎉 All basic checks passed!');
    console.log('\nNote: For full smoke tests with JS exception tracking,');
    console.log('run the Playwright tests in a local or CI/CD environment:');
    console.log('  npm run test:smoke\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some checks failed. Please verify servers are running:');
    console.log('  Frontend: npm run dev (should be on port 5000)');
    console.log('  Backend: uvicorn main:app (should be on port 8000)\n');
    process.exit(1);
  }
}

runTests();
