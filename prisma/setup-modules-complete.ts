import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 11 módulos com imagens temáticas (Unsplash fallback URLs)
const moduleImages = [
  { id: 1, name: 'Fundamentos de Engenharia', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
  { id: 2, name: 'React & Frontend', imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f1?w=800&h=400&fit=crop' },
  { id: 3, name: 'Node.js & Express', imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop' },
  { id: 4, name: 'Databases & Data Modeling', imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop' },
  { id: 5, name: 'Caching, Performance & Real-time', imageUrl: 'https://images.unsplash.com/photo-1460925895917-adf4e5f5f5e5?w=800&h=400&fit=crop' },
  { id: 6, name: 'Testing & QA', imageUrl: 'https://images.unsplash.com/photo-1516534775068-bb57a52f4fee?w=800&h=400&fit=crop' },
  { id: 7, name: 'SOLID & Design Patterns', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
  { id: 8, name: 'System Design & Scalability', imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop' },
  { id: 9, name: 'DevOps & Containerization', imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop' },
  { id: 10, name: 'Claude AI Integration', imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8de13bd21e840991f78f4ee4b60?w=800&h=400&fit=crop' },
  { id: 11, name: 'Capstone Project', imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
];

async function setupModules() {
  console.log('🌱 Setting up modules with images and resetting progress...\n');

  try {
    // 1. Reset progress for demo user
    const demoUser = await prisma.user.findUnique({ where: { email: 'demo@example.com' } });
    if (demoUser) {
      await prisma.userProgress.deleteMany({ where: { userId: demoUser.id } });
      console.log(`✅ Progress reset for ${demoUser.email}`);
    }

    // 2. Update modules with images
    for (const moduleData of moduleImages) {
      await prisma.module.update({
        where: { id: moduleData.id },
        data: { title: moduleData.name, imageUrl: moduleData.imageUrl },
      });
      console.log(`✅ Module ${moduleData.id}: ${moduleData.name} (image updated)`);
    }

    console.log('\n✨ Setup complete!');
    console.log('📊 Summary:');
    console.log('  ✅ 11 modules with images');
    console.log('  ✅ Progress reset to 0%');
    console.log('  ✅ Ready to test');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupModules();
