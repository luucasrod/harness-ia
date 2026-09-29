import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

const db = new PrismaClient();

async function createAdmin() {
  console.log('🌱 Creating admin user...');
  
  const email = 'demo@example.com';
  const password = 'harness@123';
  
  // Check if user exists
  const existing = await db.user.findUnique({
    where: { email },
  });
  
  if (existing) {
    console.log(`✅ User already exists: ${email}`);
    return;
  }
  
  const hashedPassword = await bcryptjs.hash(password, 10);
  
  const user = await db.user.create({
    data: {
      email,
      name: 'Demo User',
      password_hash: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  console.log(`✅ Admin user created:`);
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: ADMIN`);
}

createAdmin()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
