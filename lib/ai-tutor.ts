const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = 'gpt-4o-mini';

interface TutorContext {
  userId: string;
  userName?: string;
  lessonTitle?: string;
  exerciseQuestion?: string;
  userAnswer?: string;
}

interface TutorResponse {
  message: string;
  confidence: number;
  suggestedNextStep?: string;
}

export async function getTutorResponse(
  userMessage: string,
  context: TutorContext
): Promise<TutorResponse> {
  if (!OPENAI_API_KEY) {
    return {
      message: 'Tutor indisponível. Configure OPENAI_API_KEY no .env.local',
      confidence: 0,
    };
  }

  try {
    const systemPrompt = buildSystemPrompt(context);
    const userPrompt = buildUserPrompt(userMessage, context);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return {
        message: 'Erro ao conectar com o tutor. Tente novamente.',
        confidence: 0,
      };
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || 'Sem resposta';

    return {
      message,
      confidence: 0.95,
      suggestedNextStep: 'Tem mais dúvidas sobre este tópico?',
    };
  } catch (error) {
    console.error('Tutor error:', error);
    return {
      message: 'Desculpe, encontrei um erro. Tente novamente em instantes.',
      confidence: 0,
    };
  }
}

function buildSystemPrompt(context: TutorContext): string {
  return `Você é um tutor de engenharia de software experiente e paciente.
Seu objetivo é ajudar estudantes a entender conceitos de arquitetura, padrões de design, boas práticas e debugging.

Instruções:
1. Seja claro e acessível - evite jargão sem explicação
2. Use exemplos práticos e reais
3. Pergunte de volta para entender melhor o que o aluno não compreendeu
4. Seja encorajador e positivo
5. Mantenha respostas concisas (máximo 3 parágrafos)
6. Responda em português brasileiro

Contexto do estudante:
- Nome: ${context.userName || 'Estudante'}
- Lição atual: ${context.lessonTitle || 'Geral'}
${context.exerciseQuestion ? `- Exercício: ${context.exerciseQuestion}` : ''}
${context.userAnswer ? `- Resposta do aluno: ${context.userAnswer}` : ''}`;
}

function buildUserPrompt(message: string, context: TutorContext): string {
  if (context.userAnswer && context.exerciseQuestion) {
    return `O aluno respondeu: "${context.userAnswer}"

Para a pergunta: "${context.exerciseQuestion}"

Sua pergunta/dúvida: ${message}

Favor fornecer feedback construtivo e ajude-o a entender melhor.`;
  }

  return `Pergunta: ${message}`;
}

export async function generateExerciseFeedback(
  exercise: string,
  userAnswer: string,
  correctAnswer: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return 'Tutor indisponível no momento.';
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'Você é um tutor que fornece feedback construtivo em português. Seja breve (2-3 frases), positivo e educar.',
          },
          {
            role: 'user',
            content: `Exercício: ${exercise}
Resposta do aluno: ${userAnswer}
Resposta correta: ${correctAnswer}

Forneça feedback breve e construtivo.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      return 'Não foi possível gerar feedback no momento.';
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Feedback não disponível.';
  } catch (error) {
    console.error('Feedback generation error:', error);
    return 'Erro ao gerar feedback.';
  }
}
