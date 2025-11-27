// Script to hash password for database insertion
// Usage: node scripts/hash-password.js "your-password"

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Please provide a password as argument');
  console.log('Usage: node scripts/hash-password.js "your-password"');
  process.exit(1);
}

const hashedPassword = bcrypt.hashSync(password, 10);
console.log('\nOriginal password:', password);
console.log('Hashed password:', hashedPassword);
console.log('\nYou can use this hashed password in your SQL migration or database insert.\n');

