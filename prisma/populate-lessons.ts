import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type LessonSeed = {
  title: string;
  content: string;
  duration: number;
};

const lessonsByModuleId: Record<number, LessonSeed[]> = {
  7: [
    {
      title: 'Pensamento Estrutural para Engenharia de Software',
      content:
        'Introducao aos fundamentos de engenharia aplicados ao software: decomposicao de problemas, trade-offs, restricoes e tomada de decisao tecnica.',
      duration: 40,
    },
    {
      title: 'Requisitos, Escopo e Criterios de Aceite',
      content:
        'Como transformar necessidades de produto em requisitos claros, definir limites de escopo e escrever criterios de aceite verificaveis.',
      duration: 45,
    },
    {
      title: 'Arquitetura em Camadas e Separacao de Responsabilidades',
      content:
        'Estudo dos blocos essenciais de uma aplicacao bem organizada, separando interface, dominio, dados e integracoes externas.',
      duration: 50,
    },
    {
      title: 'Qualidade, Manutenibilidade e Revisao Tecnica',
      content:
        'Praticas para avaliar qualidade de codigo, reduzir acoplamento, melhorar legibilidade e conduzir revisoes tecnicas produtivas.',
      duration: 35,
    },
    {
      title: 'Debugging Sistematico e Analise de Causa Raiz',
      content:
        'Metodo pratico para investigar falhas, reproduzir bugs, isolar hipoteses e corrigir problemas sem introduzir regressao.',
      duration: 45,
    },
  ],
  8: [
    {
      title: 'Fundamentos Modernos de React',
      content:
        'Revisao pratica de componentes, props, estado, composicao e renderizacao declarativa em aplicacoes React modernas.',
      duration: 45,
    },
    {
      title: 'Estado, Eventos e Formularios',
      content:
        'Como modelar estado de interface, lidar com eventos de usuario, validar formularios e manter fluxos previsiveis.',
      duration: 50,
    },
    {
      title: 'Data Fetching e Estados de Carregamento',
      content:
        'Padroes para buscar dados, tratar loading, erro e vazio, alem de organizar a experiencia do usuario durante operacoes assincronas.',
      duration: 40,
    },
    {
      title: 'Componentizacao e Design Systems',
      content:
        'Como criar componentes reutilizaveis, consistentes e acessiveis, alinhando implementacao frontend com um sistema visual.',
      duration: 45,
    },
    {
      title: 'Performance e Acessibilidade no Frontend',
      content:
        'Tecnicas para reduzir renderizacoes desnecessarias, melhorar navegacao por teclado, semantica HTML e percepcao de velocidade.',
      duration: 35,
    },
  ],
  9: [
    {
      title: 'Arquitetura de APIs com Node.js',
      content:
        'Fundamentos de servidores Node.js, ciclo request-response, middlewares e organizacao de uma API HTTP escalavel.',
      duration: 45,
    },
    {
      title: 'Rotas, Controllers e Services no Express',
      content:
        'Como estruturar rotas Express separando responsabilidades entre entrada HTTP, regras de negocio e acesso a dados.',
      duration: 50,
    },
    {
      title: 'Validacao, Erros e Contratos de API',
      content:
        'Padroes para validar payloads, retornar erros consistentes e manter contratos claros entre frontend e backend.',
      duration: 40,
    },
    {
      title: 'Autenticacao e Autorizacao',
      content:
        'Introducao a sessoes, tokens, protecao de rotas e modelagem de permissoes para endpoints backend.',
      duration: 55,
    },
    {
      title: 'Observabilidade e Operacao de APIs',
      content:
        'Praticas de logs, health checks, metricas basicas e diagnostico de problemas em servicos Node.js em producao.',
      duration: 35,
    },
  ],
  10: [
    {
      title: 'Estrategia de Testes para Aplicacoes Web',
      content:
        'Como combinar testes unitarios, integracao e ponta a ponta para cobrir riscos reais sem criar suites lentas ou frageis.',
      duration: 40,
    },
    {
      title: 'Testes Unitarios e Mocks Confiaveis',
      content:
        'Boas praticas para testar funcoes e componentes isolados, usando mocks apenas quando eles ajudam a expressar comportamento.',
      duration: 45,
    },
    {
      title: 'Testes de Integracao com Banco e APIs',
      content:
        'Como validar fluxos que atravessam camadas da aplicacao, cobrindo persistencia, regras de negocio e respostas HTTP.',
      duration: 50,
    },
    {
      title: 'Testes End-to-End e Jornada do Usuario',
      content:
        'Modelagem de cenarios E2E focados em jornadas criticas, estabilidade dos seletores e diagnostico de falhas.',
      duration: 45,
    },
    {
      title: 'QA Continuo e Prevencao de Regressao',
      content:
        'Uso de pipelines, checklists e revisoes de qualidade para detectar regressao cedo e manter confianca no deploy.',
      duration: 35,
    },
  ],
  11: [
    {
      title: 'Principios SOLID na Pratica',
      content:
        'Visao aplicada dos cinco principios SOLID e como eles reduzem acoplamento, melhoram extensibilidade e facilitam testes.',
      duration: 45,
    },
    {
      title: 'Single Responsibility e Open/Closed',
      content:
        'Como reconhecer classes e modulos com responsabilidades misturadas e evoluir comportamento sem alterar codigo estavel.',
      duration: 40,
    },
    {
      title: 'Liskov, Interface Segregation e Dependency Inversion',
      content:
        'Aplicacao dos principios voltados a contratos, substituicao segura, interfaces pequenas e dependencia de abstracoes.',
      duration: 50,
    },
    {
      title: 'Padroes Criacionais e Estruturais',
      content:
        'Quando usar factories, adapters, decorators e outros padroes para resolver problemas recorrentes sem excesso de abstracao.',
      duration: 45,
    },
    {
      title: 'Padroes Comportamentais e Refatoracao',
      content:
        'Uso de strategy, observer e command para organizar comportamento, alem de tecnicas para introduzir padroes gradualmente.',
      duration: 55,
    },
  ],
  12: [
    {
      title: 'Fundamentos de DevOps e Entrega Continua',
      content:
        'Principios de colaboracao, automacao e feedback rapido para levar codigo do desenvolvimento ate producao com confianca.',
      duration: 40,
    },
    {
      title: 'Docker: Imagens, Containers e Volumes',
      content:
        'Conceitos essenciais de Docker, criacao de imagens, execucao de containers, persistencia e isolamento de ambiente.',
      duration: 50,
    },
    {
      title: 'Docker Compose para Ambientes Locais',
      content:
        'Como orquestrar aplicacao, banco de dados e servicos auxiliares em um ambiente local reproduzivel com Docker Compose.',
      duration: 45,
    },
    {
      title: 'Pipelines de CI/CD',
      content:
        'Estrutura de pipelines para instalar dependencias, rodar testes, gerar builds e preparar releases automatizados.',
      duration: 55,
    },
    {
      title: 'Deploy, Configuracao e Monitoramento',
      content:
        'Praticas para variaveis de ambiente, migracoes, logs, health checks e acompanhamento pos-deploy.',
      duration: 35,
    },
  ],
};

async function main() {
  console.log('Populating missing lessons for empty modules in course 1...');

  const modules = await prisma.module.findMany({
    where: {
      courseId: 1,
      id: { in: Object.keys(lessonsByModuleId).map(Number) },
    },
    include: {
      _count: {
        select: { lessons: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  const foundModuleIds = new Set(modules.map((module) => module.id));
  const missingModuleIds = Object.keys(lessonsByModuleId)
    .map(Number)
    .filter((moduleId) => !foundModuleIds.has(moduleId));

  if (missingModuleIds.length > 0) {
    throw new Error(`Expected modules not found in course 1: ${missingModuleIds.join(', ')}`);
  }

  let totalCreated = 0;

  for (const module of modules) {
    if (module._count.lessons > 0) {
      console.log(
        `Skipping module ${module.id} (${module.title}): already has ${module._count.lessons} lessons.`
      );
      continue;
    }

    const lessons = lessonsByModuleId[module.id].map((lesson, index) => ({
      ...lesson,
      type: 'CONTENT',
      order: index + 1,
      moduleId: module.id,
    }));

    const result = await prisma.lesson.createMany({ data: lessons });
    totalCreated += result.count;

    console.log(`Created ${result.count} lessons for module ${module.id} (${module.title}).`);
  }

  console.log(`Done. Created ${totalCreated} lessons.`);
}

main()
  .catch((error) => {
    console.error('Failed to populate lessons:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
