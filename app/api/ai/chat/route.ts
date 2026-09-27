import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getTutorResponse } from '@/lib/ai-tutor';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

interface ChatRequest {
  message: string;
  lessonId?: number;
  exerciseId?: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: { code: 'AUTH_REQUIRED', message: 'Autenticação necessária' } },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { message, lessonId, exerciseId }: ChatRequest = await request.json();

    if (!message || message.trim().length === 0) {
      return Response.json(
        { success: false, error: { code: 'EMPTY_MESSAGE', message: 'Mensagem não pode estar vazia' } },
        { status: 400 }
      );
    }

    let lessonTitle: string | undefined;
    let exerciseQuestion: string | undefined;

    if (lessonId) {
      const lesson = await db.lesson.findUnique({
        where: { id: lessonId },
      });
      lessonTitle = lesson?.title;
    }

    if (exerciseId) {
      const exercise = await db.exercise.findUnique({
        where: { id: exerciseId },
      });
      exerciseQuestion = exercise?.description;
    }

    const tutorResponse = await getTutorResponse(message, {
      userId: session.user.id,
      userName: session.user.name || undefined,
      lessonTitle,
      exerciseQuestion,
    });

    return Response.json({
      success: true,
      data: {
        message: tutorResponse.message,
        confidence: tutorResponse.confidence,
        suggestedNextStep: tutorResponse.suggestedNextStep,
        timestamp: new Date().toISOString(),
      },
      message: 'ok',
    });
  } catch (error) {
    console.error('POST /api/ai/chat error:', error);
    return Response.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Erro ao processar mensagem' } },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
