import { PrismaClient } from '@prisma/client';
import type { Module } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@example.com';
const LOCAL_IMAGE_DIR = path.join(process.cwd(), 'public', 'module-images');
const AI_KEYS = ['LEONARDO_API_KEY', 'IMAGEN_API_KEY', 'IMAGE_GEN_API_KEY'];

type ImageSource = 'ai' | 'local' | 'stock';

interface ModuleSpec {
  order: number;
  title: string;
  slug: string;
  stockUrl: string;
}

interface ResolvedImage {
  url: string;
  source: ImageSource;
}

const MODULES: ModuleSpec[] = [
  {
    order: 1,
    title: 'Fundamentos de Engenharia',
    slug: 'engineering-foundations',
    stockUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
  },
  {
    order: 2,
    title: 'React & Frontend',
    slug: 'react-frontend',
    stockUrl: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=800&h=400&fit=crop',
  },
  {
    order: 3,
    title: 'Node.js & Express',
    slug: 'nodejs-express',
    stockUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop',
  },
  {
    order: 4,
    title: 'Databases & Data Modeling',
    slug: 'databases',
    stockUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=400&fit=crop',
  },
  {
    order: 5,
    title: 'Caching, Performance & Real-time',
    slug: 'caching-realtime',
    stockUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=400&fit=crop',
  },
  {
    order: 6,
    title: 'Testing & QA',
    slug: 'testing-qa',
    stockUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
  },
  {
    order: 7,
    title: 'SOLID & Design Patterns',
    slug: 'solid-patterns',
    stockUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=400&fit=crop',
  },
  {
    order: 8,
    title: 'System Design & Scalability',
    slug: 'system-design',
    stockUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
  },
  {
    order: 9,
    title: 'DevOps & Containerization',
    slug: 'devops-containers',
    stockUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop',
  },
  {
    order: 10,
    title: 'Claude AI Integration',
    slug: 'claude-ai',
    stockUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=400&fit=crop',
  },
  {
    order: 11,
    title: 'Capstone Project',
    slug: 'capstone-project',
    stockUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
  },
];

function hasAiAccess(): boolean {
  return AI_KEYS.some((key) => Boolean(process.env[key]?.trim()));
}

async function generateWithAi(spec: ModuleSpec): Promise<string | null> {
  if (!hasAiAccess()) return null;
  console.warn(
    `  ⚠️ Chave de geração de imagem presente, mas o provider não está implementado (${spec.slug}).`
  );
  return null;
}

async function resolveImages(): Promise<Map<number, ResolvedImage>> {
  const resolved = new Map<number, ResolvedImage>();

  for (const spec of MODULES) {
    const aiUrl = await generateWithAi(spec);
    const localPath = path.join(LOCAL_IMAGE_DIR, `${spec.slug}.svg`);
    const localExists = fs.existsSync(localPath);

    if (aiUrl) {
      resolved.set(spec.order, { url: aiUrl, source: 'ai' });
      console.log(`  ✅ [ai]    ${spec.title}`);
    } else if (localExists) {
      resolved.set(spec.order, {
        url: `/module-images/${spec.slug}.svg`,
        source: 'local',
      });
      console.log(`  ✅ [local] ${spec.title} -> /module-images/${spec.slug}.svg`);
    } else {
      resolved.set(spec.order, { url: spec.stockUrl, source: 'stock' });
      console.log(`  ⚠️ [stock] ${spec.title} -> ${spec.stockUrl}`);
    }
  }

  return resolved;
}

async function clearDemoProgress(): Promise<number> {
  const result = await prisma.userProgress.deleteMany({
    where: { user: { email: DEMO_EMAIL } },
  });

  if (result.count === 0) {
    const user = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
    console.log(
      user
        ? `  ✅ Progresso de ${DEMO_EMAIL}: já estava zerado (0 registros)`
        : `  ⚠️ Usuário ${DEMO_EMAIL} não encontrado no banco`
    );
  } else {
    console.log(`  ✅ Progresso de ${DEMO_EMAIL}: ${result.count} registros removidos`);
  }

  return result.count;
}

async function updateModules(images: Map<number, ResolvedImage>) {
  const existing = await prisma.module.findMany({ orderBy: { order: 'asc' } });
  const course = await prisma.course.findFirst({ orderBy: { order: 'asc' } });

  const byOrder = new Map<number, Module>(existing.map((m) => [m.order, m]));
  const byTitle = new Map<string, Module>(existing.map((m) => [m.title, m]));

  let updated = 0;
  let created = 0;

  for (const spec of MODULES) {
    const image = images.get(spec.order);
    if (!image) continue;

    const match = byOrder.get(spec.order) ?? byTitle.get(spec.title);

    if (match) {
      await prisma.module.update({
        where: { id: match.id },
        data: { imageUrl: image.url },
      });
      updated += 1;
      console.log(
        `  ✅ Update  #${spec.order} ${match.title} (id ${match.id}) -> ${image.url}`
      );
    } else {
      await prisma.module.create({
        data: {
          title: spec.title,
          order: spec.order,
          courseId: course?.id ?? null,
          imageUrl: image.url,
        },
      });
      created += 1;
      console.log(`  ✅ Create  #${spec.order} ${spec.title} -> ${image.url}`);
    }
  }

  return { updated, created };
}

async function verify() {
  const modules = await prisma.module.findMany({ orderBy: { order: 'asc' } });
  const missing = modules.filter((m) => !m.imageUrl);
  const progress = await prisma.userProgress.count({
    where: { user: { email: DEMO_EMAIL } },
  });

  console.log('\n📊 Estado final do banco:');
  for (const mod of modules) {
    console.log(
      `  #${String(mod.order).padStart(2, '0')} id=${String(mod.id).padStart(2)} ${
        mod.imageUrl ? '✅' : '❌ sem imagem'
      } ${mod.title}`
    );
    console.log(`       ${mod.imageUrl ?? '(null)'}`);
  }

  console.log(`\n  Módulos: ${modules.length}`);
  console.log(`  Módulos sem imageUrl: ${missing.length}`);
  console.log(`  UserProgress (${DEMO_EMAIL}): ${progress}`);
}

async function main() {
  console.log('🌱 Setup de imagens dos módulos\n');

  console.log('1) Gerando/resolvendo imagens dos 11 módulos...');
  const images = await resolveImages();

  console.log('\n2) Limpando progresso do usuário demo...');
  await clearDemoProgress();

  console.log('\n3) Grando imageUrl nos módulos...');
  const { updated, created } = await updateModules(images);
  console.log(`  ✅ ${updated} atualizados, ${created} criados`);

  await verify();

  console.log('\n✨ Setup concluído!');
}

main()
  .catch((error) => {
    console.error('❌ Setup falhou:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
