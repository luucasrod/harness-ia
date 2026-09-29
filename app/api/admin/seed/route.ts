import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const secret = request.headers.get('x-seed-secret');
    if (secret !== process.env.SEED_SECRET) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hash = bcrypt.hashSync('harness@123', 10);

    await prisma.user.deleteMany({
      where: { email: 'demo@example.com' }
    }).catch(() => null);

    const user = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        name: 'Demo User',
        password_hash: hash,
        role: 'STUDENT',
      },
    });

    return Response.json({
      success: true,
      message: 'User seeded successfully',
      user: { id: user.id, email: user.email }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json(
      { error: 'Seed failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
