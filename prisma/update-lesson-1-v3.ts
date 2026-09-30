import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newContent = `<h1>Pensamento Estrutural para Engenharia de Software</h1>

<div style="background: rgba(0, 102, 255, 0.08); padding: 1.5rem; border-radius: 6px; margin-bottom: 2rem; border-left: 5px solid #0066ff;">
  <h2 style="font-size: 1.4em; font-weight: 700; margin-top: 0; margin-bottom: 1rem; color: #ffffff;">Contexto</h2>
  <ul style="margin: 0.8rem 0; line-height: 1.6;">
    <li><strong style="color: #00d4ff;">O que você vai aprender:</strong> Como pensar sobre um problema antes de codificar — dividir em partes, entender limites, validar solução.</li>
    <li><strong style="color: #00d4ff;">Por que importa:</strong> A maioria dos bugs não é de código, é de pensamento confuso. Um pensamento claro torna tudo mais fácil.</li>
    <li><strong style="color: #00d4ff;">Como vamos fazer:</strong> Vamos resolver um bug real (progresso duplicado) usando os três conceitos.</li>
  </ul>
</div>

<hr style="border: none; border-top: 2px solid rgba(0, 102, 255, 0.3); margin: 3rem 0;">

<h2>Conceitos Centrais</h2>

<div style="margin: 2.5rem 0;">
  <h3 style="font-size: 1.9em; font-weight: 900; color: #ffffff; margin: 2rem 0 1rem 0; padding-bottom: 0.8rem; border-bottom: 3px solid #0066ff;">1. Modelo Mental: Divida o Problema em Camadas</h3>

  <p style="font-size: 0.98em; color: #e8e8e8; line-height: 1.8; margin: 1.2rem 0; font-weight: 500;">Antes de escrever código, organize o problema em camadas: o que o usuário vê, o que o código faz, como o banco armazena. Quando você vê essas camadas, fica claro onde o problema está.</p>

  <div style="background: rgba(0, 102, 255, 0.1); border-left: 5px solid #0066ff; padding: 1.5rem; margin: 1.8rem 0; border-radius: 6px;">
    <h4 style="font-weight: 800; font-size: 1.1em; margin: 0 0 1rem 0; color: #ffffff;">Exemplo Real: Progresso de Aula Duplicado</h4>

    <p><strong>Problema relatado:</strong> Quando um aluno clica "Marcar como concluída" muito rápido, o progresso sobe 40% em vez de 20%. A aula foi marcada como completa 2 vezes.</p>

    <div style="background: rgba(0, 102, 255, 0.05); padding: 0.8rem; border-radius: 4px; margin: 0.8rem 0; font-size: 0.95em; line-height: 1.7;">
      <strong style="color: #00d4ff;">Camada 1 (Interface):</strong> Aluno vê o botão "Marcar como concluída". Clica 2x em < 100ms.
    </div>

    <div style="background: rgba(0, 102, 255, 0.05); padding: 0.8rem; border-radius: 4px; margin: 0.8rem 0; font-size: 0.95em; line-height: 1.7;">
      <strong style="color: #00d4ff;">Camada 2 (Código):</strong> Frontend faz 2 requests simultâneos: POST /api/progress
    </div>

    <div style="background: rgba(0, 102, 255, 0.05); padding: 0.8rem; border-radius: 4px; margin: 0.8rem 0; font-size: 0.95em; line-height: 1.7;">
      <strong style="color: #00d4ff;">Camada 3 (Banco):</strong> Banco recebe 2 UPDATEs ao mesmo tempo. Qual vence?
    </div>

    <p><strong>Insight:</strong> Agora você sabe que o problema está entre Camada 2 (código não esperava 2 requests juntas) e Camada 3 (banco processou ambas).</p>
  </div>

  <p style="font-size: 0.96em; color: #e8e8e8; margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.15); font-style: italic;"><strong>Aplicação:</strong> Quando encontrar um bug estranho, sempre pergunte: em que camada estou? O que vem antes e depois? Desenhe as camadas em papel, fica muito mais claro.</p>
</div>

<hr style="border: none; border-top: 2px solid rgba(0, 102, 255, 0.3); margin: 3rem 0;">

<div style="margin: 2.5rem 0;">
  <h3 style="font-size: 1.9em; font-weight: 900; color: #ffffff; margin: 2rem 0 1rem 0; padding-bottom: 0.8rem; border-bottom: 3px solid #0066ff;">2. Responsabilidades: Saiba Quem é Responsável por Quê</h3>

  <p style="font-size: 0.98em; color: #e8e8e8; line-height: 1.8; margin: 1.2rem 0; font-weight: 500;">Cada componente (front, back, banco) tem uma responsabilidade. Se você não sabe quem é responsável, o bug fica invisível. Quando você respeita limites, fica fácil debugar.</p>

  <div style="background: rgba(0, 102, 255, 0.1); border-left: 5px solid #0066ff; padding: 1.5rem; margin: 1.8rem 0; border-radius: 6px;">
    <h4 style="font-weight: 800; font-size: 1.1em; margin: 0 0 1rem 0; color: #ffffff;">Exemplo Real: Resolvendo o Progresso Duplicado</h4>

    <p><strong>Pergunta:</strong> Quem é responsável por evitar updates duplicados?</p>

    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Frontend:</strong> Responsável por não enviar 2 requests (desabilitar botão após click? Dedupliar requests?).</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Backend:</strong> Responsável por validar (idempotência - segunda request com mesmo ID retorna mesmo resultado).</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Banco:</strong> Responsável por consistência (transação, lock).</li>
    </ul>

    <p><strong>Solução (respeitando responsabilidades):</strong></p>
    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Frontend:</strong> Desabilita botão por 2 segundos depois do click.</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Backend:</strong> Checa se essa aula já foi marcada como concluída antes (idempotência).</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Banco:</strong> Usa transação com lock: \`BEGIN; UPDATE progress ... FOR UPDATE; COMMIT;\`</li>
    </ul>

    <p><strong>Resultado:</strong> Cada camada faz sua parte. Se quebrar em uma, você sabe exatamente onde procurar.</p>
  </div>

  <p style="font-size: 0.96em; color: #e8e8e8; margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.15); font-style: italic;"><strong>Aplicação:</strong> Antes de escrever código, sempre escreva: "Frontend é responsável por ___, Backend por ___, Banco por ___". Respeitar essa separação torna o código muito mais fácil de revisar e debugar.</p>
</div>

<hr style="border: none; border-top: 2px solid rgba(0, 102, 255, 0.3); margin: 3rem 0;">

<div style="margin: 2.5rem 0;">
  <h3 style="font-size: 1.9em; font-weight: 900; color: #ffffff; margin: 2rem 0 1rem 0; padding-bottom: 0.8rem; border-bottom: 3px solid #0066ff;">3. Critérios de Qualidade: Como Você Sabe que Resolveu?</h3>

  <p style="font-size: 0.98em; color: #e8e8e8; line-height: 1.8; margin: 1.2rem 0; font-weight: 500;">Não é suficiente "achar que resolveu". Você precisa de critérios objetivos: teste, log, métrica. Quando você tem critérios claros, fica fácil saber se a solução funciona.</p>

  <div style="background: rgba(0, 102, 255, 0.1); border-left: 5px solid #0066ff; padding: 1.5rem; margin: 1.8rem 0; border-radius: 6px;">
    <h4 style="font-weight: 800; font-size: 1.1em; margin: 0 0 1rem 0; color: #ffffff;">Exemplo Real: Validando a Solução</h4>

    <p><strong>Qual é o critério para saber que o bug foi resolvido?</strong></p>

    <ul style="margin: 1rem 0; padding-left: 1.5rem;">
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Critério 1 (Teste):</strong> Simular 10 clicks simultâneos. Resultado: progresso sobe 20% (uma vez). ✓</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Critério 2 (Log):</strong> Ver no banco que UPDATE foi executado uma vez (não 2). ✓</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Critério 3 (Métrica):</strong> Histórico de alunos: nenhum com progresso > 100% ou duplicado. ✓</li>
      <li style="margin: 0.7rem 0; line-height: 1.7; font-size: 0.96em;"><strong>Critério 4 (Observabilidade):</strong> Logs mostram transação, lock, resultado. ✓</li>
    </ul>

    <p><strong>Resultado:</strong> Você tem 4 formas diferentes de validar. Uma quebra? Você descobre antes que o aluno.</p>
  </div>

  <p style="font-size: 0.96em; color: #e8e8e8; margin-top: 1.5rem; padding-top: 1.2rem; border-top: 1px solid rgba(255,255,255,0.15); font-style: italic;"><strong>Aplicação:</strong> Sempre escreva critérios antes de começar a resolver. "Como vou saber que funcionou?" Teste, log, métrica? Ter critérios claros evita surpresas em produção.</p>
</div>

<hr style="border: none; border-top: 2px solid rgba(0, 102, 255, 0.3); margin: 3rem 0;">

<h2>Exercício Final</h2>

<div style="background: rgba(0, 102, 255, 0.12); padding: 1.5rem; border-radius: 6px; border-left: 5px solid #0066ff; margin: 2rem 0;">
  <h3 style="color: #ffffff;">Seu Desafio</h3>

  <p><strong>Cenário:</strong> Usuário reporta: "Meu certificado aparece como 'Incompleto' mas completei todas as aulas".</p>

  <p><strong>Sua tarefa (20 minutos):</strong></p>
  <ul>
    <li><strong>Camadas:</strong> Desenhe as 3 camadas (interface, código, banco) e onde o problema pode estar.</li>
    <li><strong>Responsabilidades:</strong> Escreva quem é responsável por cada camada.</li>
    <li><strong>Critérios:</strong> Liste 3 formas diferentes de validar que resolveu (teste, log, métrica).</li>
    <li><strong>Solução:</strong> Escreva uma mudança pequena (1-2 linhas de código) que você faria primeiro.</li>
  </ul>

  <p><strong>Dica:</strong> Isso é pensamento estrutural em ação. Comece desenhando, não codificando.</p>
</div>

<h2>Resumo</h2>

<ul>
  <li>✅ <strong>Modelo Mental:</strong> Divida em camadas (UI → Código → Banco)</li>
  <li>✅ <strong>Responsabilidades:</strong> Cada componente tem seu trabalho, respeite os limites</li>
  <li>✅ <strong>Critérios:</strong> Sempre tenha uma forma de validar (teste, log, métrica)</li>
</ul>

<p><strong>O que você vai levar:</strong> Quando encontrar um bug confuso, pegue papel, desenhe as camadas, defina responsabilidades, escreva critérios. Isso é pensamento estrutural. Funciona sempre.</p>
`;

async function main() {
  const lesson = await prisma.lesson.findFirst({
    where: { moduleId: 7, order: 1 },
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: { content: newContent },
  });

  console.log(`Updated lesson ${lesson.id}: ${lesson.title}`);
  console.log('Conteúdo agora começa com <h1> HTML puro');
}

main()
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
