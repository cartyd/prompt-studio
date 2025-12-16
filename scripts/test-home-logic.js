#!/usr/bin/env node

// Simple test script to validate our extracted business logic
const { getStartedButtonLogic, HOME_FEATURES } = require('../lib/utils/home.js');

console.log('🧪 Testing Home Route Business Logic\n');

// Test getStartedButtonLogic function
console.log('📝 Testing getStartedButtonLogic:');

// Test case 1: No user (null)
const result1 = getStartedButtonLogic(null);
console.log('  ✓ null user:', JSON.stringify(result1));

// Test case 2: User exists
const result2 = getStartedButtonLogic({ id: 1, email: 'test@test.com' });
console.log('  ✓ authenticated user:', JSON.stringify(result2));

// Test case 3: Undefined user
const result3 = getStartedButtonLogic(undefined);
console.log('  ✓ undefined user:', JSON.stringify(result3));

console.log('\n🎯 Testing HOME_FEATURES constant:');
console.log(`  ✓ Features count: ${HOME_FEATURES.length}`);
console.log('  ✓ Sample feature:', JSON.stringify(HOME_FEATURES[0], null, 2));

// Validation
const validationResults = [];

// Validate button logic
if (result1.href === '/auth/register' && result1.text === 'Get Started') {
  validationResults.push('✅ Unauthenticated user test passed');
} else {
  validationResults.push('❌ Unauthenticated user test failed');
}

if (result2.href === '/frameworks' && result2.text === 'Explore Frameworks') {
  validationResults.push('✅ Authenticated user test passed');
} else {
  validationResults.push('❌ Authenticated user test failed');
}

// Validate features structure
if (HOME_FEATURES.length === 6 && 
    HOME_FEATURES.every(f => f.icon && f.title && f.description)) {
  validationResults.push('✅ Features structure test passed');
} else {
  validationResults.push('❌ Features structure test failed');
}

console.log('\n📊 Validation Results:');
validationResults.forEach(result => console.log(`  ${result}`));

const allPassed = validationResults.every(r => r.includes('✅'));
console.log(`\n${allPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`);
process.exit(allPassed ? 0 : 1);