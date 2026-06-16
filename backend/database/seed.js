const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default admin if not exists
  const defaultAdminUsername = process.env.ADMIN_USERNAME || 'admin';
  const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = await prisma.admin.findUnique({
    where: { username: defaultAdminUsername },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(defaultAdminPassword, 10);
    await prisma.admin.create({
      data: {
        username: defaultAdminUsername,
        password: hashedPassword,
      },
    });
    console.log(`Default admin created: ${defaultAdminUsername}`);
  } else {
    console.log('Admin already exists.');
  }

  // Create default settings
  const defaultSettings = [
    { key: 'AI_PROVIDER', value: 'local' }, // 'local', 'gemini', 'openrouter'
    { key: 'OPENROUTER_API_KEY', value: '' },
    { key: 'GEMINI_API_KEY', value: '' },
    { key: 'OPENROUTER_MODEL', value: 'google/gemini-2.5-flash' },
    { key: 'FREE_LIMIT_PRESENTATIONS', value: '5' },
    { key: 'FREE_LIMIT_EXPORTS', value: '10' },
    { key: 'THEMES', value: JSON.stringify(['default', 'dark', 'minimalist', 'ocean', 'neon']) },
  ];

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('Default system settings seeded.');
  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
