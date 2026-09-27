import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !name || !password) {
      return Response.json(
        { success: false, error: { code: 'MISSING_FIELDS', message: 'Email, nome e senha são obrigatórios' } },
        { status: 400 }
      );
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { success: false, error: { code: 'USER_EXISTS', message: 'Email já cadastrado' } },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        name,
        password_hash: passwordHash,
        role: 'STUDENT',
      },
    });

    const courses = await db.course.findMany();

    for (const course of courses) {
      await db.enrollment.create({
        data: {
          userId: user.id,
          courseId: course.id,
        },
      });
    }

    return Response.json(
      {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: 'Conta criada com sucesso',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao criar conta' } },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
