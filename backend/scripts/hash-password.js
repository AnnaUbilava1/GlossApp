// Hash a password the same way as auth (bcryptjs, 10 rounds).
// Usage: node scripts/hash-password.js <plain-password>
import bcrypt from 'bcryptjs';

const plain = process.argv[2];
if (!plain) {
  console.error('Usage: node scripts/hash-password.js <plain-password>');
  process.exit(1);
}

const hashed = await bcrypt.hash(plain, 10);
console.log(hashed);
