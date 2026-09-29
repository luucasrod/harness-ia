import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const moduleImages: Record<string, string> = {
  'Claude AI Integration': 'https://images.unsplash.com/photo-1677442d019cecf8de13bd21e840991f78f4ee4b60?w=800&h=400&fit=crop',
  'Capstone Project: Build Your Harness Tutor': 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
  'Databases & Data Modeling': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
  'Caching, Performance & Real-time': 'https://images.unsplash.com/photo-1460925895917-adf4e5f5f5e5?w=800&h=400&fit=crop',
  'System Design & Scalability': 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop',
};

async function setupModules() {
  console.log('🌱 Fetching modules and updating with images...\n');

  try {
    // Reset progress for demo user
    const demoUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
    if (demoUser) {
      const deleted = await prisma.userProgress.deleteMany({ where: { userId: demoUser.id } });
      console.log(`✅ Progress reset for ${demoUser.email} (deleted ${deleted.count} records)`);
    }

    // Get all modules and update with images
    const modules = await prisma.module.findMany({ orderBy: { id: 'asc' } });
    console.log(`\n📚 Found ${modules.length} modules\n`);

    for (const module of modules) {
      const imageUrl = moduleImages[module.title] || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop';
      await prisma.module.update({
        where: { id: module.id },
        data: { imageUrl },
      });
      console.log(`✅ Module "${module.title}" (ID: ${module.id})`);
    }

    console.log('\n✨ Setup complete!');
    console.log(`  ✅ ${modules.length} modules with images`);
    console.log('  ✅ Progress reset to 0%');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupModules();
