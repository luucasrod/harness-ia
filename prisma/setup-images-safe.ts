import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const moduleImages = [
  { id: 1, imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
  { id: 2, imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134ef2944f1?w=800&h=400&fit=crop' },
  { id: 3, imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop' },
  { id: 4, imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop' },
  { id: 5, imageUrl: 'https://images.unsplash.com/photo-1460925895917-adf4e5f5f5e5?w=800&h=400&fit=crop' },
  { id: 6, imageUrl: 'https://images.unsplash.com/photo-1516534775068-bb57a52f4fee?w=800&h=400&fit=crop' },
  { id: 7, imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
  { id: 8, imageUrl: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=400&fit=crop' },
  { id: 9, imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop' },
  { id: 10, imageUrl: 'https://images.unsplash.com/photo-1677442d019cecf8de13bd21e840991f78f4ee4b60?w=800&h=400&fit=crop' },
  { id: 11, imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
];

async function setupImages() {
  console.log('🖼️ Setting up module images...\n');

  try {
    for (const { id, imageUrl } of moduleImages) {
      const exists = await prisma.module.findUnique({ where: { id } });
      if (exists) {
        await prisma.module.update({
          where: { id },
          data: { imageUrl },
        });
        console.log(`✅ Module ${id}: image updated`);
      } else {
        console.log(`⏭️ Module ${id}: skipped (not found)`);
      }
    }

    console.log('\n✨ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupImages();
