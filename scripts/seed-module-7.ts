import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script para MÓDULO 7: SOLID & Design Patterns
 * Adiciona lições 7.1-7.6 ao banco de dados
 *
 * Status: PARCIAL (7.1 completo)
 * Próximo: Adicionar 7.2-7.6 conforme criadas
 */

const MODULE_7_LESSONS = [
  {
    id: 'lesson-7-1-srp',
    module: 7,
    lessonNumber: 1,
    title: 'SOLID - Single Responsibility Principle (SRP)',
    slug: 'single-responsibility-principle',
    description:
      'Dominar o primeiro princípio SOLID: uma classe deve ter uma única razão para mudar. Identificar violações em código real, refatorar para aumentar testabilidade e manutenibilidade.',
    duration_minutes: 200,
    target_audience: 'Developers com experiência básica em OOP',
    order: 1,
    is_published: true,
    learning_objectives: [
      'Entender a definição rigorosa de SRP: "uma classe deve ter uma razão para mudar"',
      'Identificar violações de SRP em código real (sinais de alerta, padrões de problemas)',
      'Refatorar código acoplado em componentes especializados com responsabilidades claras',
      'Aplicar SRP em um contexto real: sistema educacional',
      'Entender trade-offs: quando separar, quando manter junto',
      'Reconhecer padrões que emergem de SRP: Repository, Service, Validator, Mapper',
    ],
  },
  // Próximas lições (placeholders para integração futura)
  {
    id: 'lesson-7-2-oclid',
    module: 7,
    lessonNumber: 2,
    title: 'SOLID - Open/Closed, Liskov, Interface, Dependency Inversion',
    slug: 'open-closed-liskov-interface-dependency-inversion',
    description:
      'Os outros quatro princípios SOLID: Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Como se complementam para criar código escalável.',
    duration_minutes: 250,
    target_audience: 'Developers com Lição 7.1 completa',
    order: 2,
    is_published: false, // Ainda em criação
    learning_objectives: [
      'Entender Open/Closed: aberto para extensão, fechado para modificação',
      'Aprender Liskov Substitution: subclasses devem ser substituíveis',
      'Dominar Interface Segregation: interfaces pequenas e focadas',
      'Entender Dependency Inversion: dependa de abstrações, não de implementações',
    ],
  },
  {
    id: 'lesson-7-3-creational-patterns',
    module: 7,
    lessonNumber: 3,
    title: 'Creational Design Patterns',
    slug: 'creational-design-patterns',
    description:
      'Singleton, Factory, Builder, Prototype. Quando usar cada um, trade-offs, implementação em TypeScript.',
    duration_minutes: 250,
    target_audience: 'Developers com SOLID básico',
    order: 3,
    is_published: false,
    learning_objectives: [
      'Entender Singleton: instância única, problema de acoplamento',
      'Dominar Factory: Simple Factory, Factory Method, Abstract Factory',
      'Aprender Builder: construir objetos complexos passo a passo',
      'Entender Prototype: clonar objetos, deep vs. shallow copy',
    ],
  },
  {
    id: 'lesson-7-4-structural-behavioral',
    module: 7,
    lessonNumber: 4,
    title: 'Structural & Behavioral Design Patterns',
    slug: 'structural-behavioral-design-patterns',
    description:
      'Adapter, Decorator, Facade, Proxy, Strategy, Observer, Command, State. Como estruturar e comportamentos em código limpo.',
    duration_minutes: 250,
    target_audience: 'Developers com patterns básicos',
    order: 4,
    is_published: false,
    learning_objectives: [
      'Entender Adapter: compatibilizar interfaces diferentes',
      'Dominar Decorator: adicionar comportamento dinamicamente',
      'Aprender Facade: simplificar interfaces complexas',
      'Entender Strategy: algoritmo intercambiável',
      'Dominar Observer: notificação de eventos',
    ],
  },
  {
    id: 'lesson-7-5-ddd',
    module: 7,
    lessonNumber: 5,
    title: 'Domain-Driven Design (DDD)',
    slug: 'domain-driven-design',
    description:
      'Ubiquitous Language, Entities, Value Objects, Aggregates, Domain Events, Bounded Contexts. Modelar domínio de forma profunda.',
    duration_minutes: 250,
    target_audience: 'Developers com patterns consolidados',
    order: 5,
    is_published: false,
    learning_objectives: [
      'Entender Ubiquitous Language: linguagem comum entre negócio e código',
      'Dominar Entities e Value Objects: quando usar cada um',
      'Aprender Aggregates: raiz agregada, limites de transação',
      'Entender Domain Events: fatos importantes no domínio',
      'Dominar Bounded Contexts: delimitar domínios, Anti-Corruption Layer',
    ],
  },
  {
    id: 'lesson-7-6-refactoring',
    module: 7,
    lessonNumber: 6,
    title: 'Refactoring Profundo',
    slug: 'refactoring-profundo',
    description:
      'Extract Method, Move Method, Extract Class, Replace Temp, Introduce Parameter Object. Refactoring com testes, TDD, Golden Master.',
    duration_minutes: 200,
    target_audience: 'Developers consolidados em design',
    order: 6,
    is_published: false,
    learning_objectives: [
      'Dominar Extract Method: dividir métodos grandes',
      'Aprender Move Method: mover para classe apropriada',
      'Entender Extract Class: dividir classe grande',
      'Dominar refactoring com testes: TDD Red-Green-Refactor',
      'Aprender Golden Master testing para refactoring seguro',
    ],
  },
];

async function seedModule7() {
  try {
    console.log('Iniciando seed do Módulo 7...');

    // Criar módulo (se não existir)
    const module = await prisma.module.upsert({
      where: { id: 'module-7' },
      update: {},
      create: {
        id: 'module-7',
        title: 'SOLID & Design Patterns',
        description:
          'Domínio profundo de SOLID, Design Patterns, DDD e Refactoring. 22 horas, 6 lições.',
        order: 7,
        duration_hours: 22,
        is_published: false, // Publicar quando 7.1 estiver validado
      },
    });

    console.log(`✓ Módulo 7 criado/atualizado: ${module.id}`);

    // Criar cada lição
    for (const lesson of MODULE_7_LESSONS) {
      const created = await prisma.lesson.upsert({
        where: { id: lesson.id },
        update: {
          title: lesson.title,
          description: lesson.description,
          duration_minutes: lesson.duration_minutes,
          is_published: lesson.is_published,
          order: lesson.order,
        },
        create: {
          id: lesson.id,
          module_id: 'module-7',
          title: lesson.title,
          slug: lesson.slug,
          description: lesson.description,
          duration_minutes: lesson.duration_minutes,
          target_audience: lesson.target_audience,
          order: lesson.order,
          is_published: lesson.is_published,
          learning_objectives: lesson.learning_objectives,
          content_path: `public/lesson-${lesson.lessonNumber}-${lesson.slug.split('-').slice(0, 2).join('-')}.md`,
          metadata_path: `public/lesson-${lesson.lessonNumber}-${lesson.slug.split('-').slice(0, 2).join('-')}.json`,
        },
      });

      const status = lesson.is_published ? '✓ PUBLICADO' : '⏳ RASCUNHO';
      console.log(`${status}: ${created.title} (${created.duration_minutes} min)`);
    }

    console.log('\n✓ Seed do Módulo 7 concluído com sucesso!');
    console.log('\nStatus:');
    console.log('  ✓ Lição 7.1 (SRP) - COMPLETA e PUBLICADA');
    console.log('  ⏳ Lições 7.2-7.6 - EM CRIAÇÃO (rascunho)');
  } catch (error) {
    console.error('Erro ao fazer seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed
seedModule7();
