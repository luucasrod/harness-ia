import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new PrismaClient();

interface LessonJSON {
  lesson_id: string;
  title: string;
  module_id: string;
  module_title: string;
  content_sections?: Array<{ heading: string; content: string }>;
  duration_minutes: number;
  word_count: number;
  learning_objectives: string[];
  examples: Array<{ description: string; code: string }>;
  exercises: Array<{ type: string; question: string; options?: string[] }>;
  practice_exercise: { description: string; hints: string[]; solution: string };
}

async function seedAllModules() {
  console.log('🌱 Seeding ALL MODULES from JSON files...\n');

  const publicDir = path.join(__dirname, '..', 'public');
  const jsonFiles = fs
    .readdirSync(publicDir)
    .filter((f) => f.startsWith('lesson-') && f.endsWith('.json'))
    .sort();

  if (jsonFiles.length === 0) {
    console.error('❌ No lesson JSON files found in public/');
    process.exit(1);
  }

  console.log(`📁 Found ${jsonFiles.length} lesson files\n`);

  // Map to track module creation
  const moduleMap = new Map<string, number>();

  for (const jsonFile of jsonFiles) {
    try {
      const jsonPath = path.join(publicDir, jsonFile);
      const mdFile = jsonFile.replace('.json', '.md');
      const mdPath = path.join(publicDir, mdFile);

      const jsonData: LessonJSON = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      const mdContent = fs.readFileSync(mdPath, 'utf-8');

      const moduleKey = jsonData.module_id;
      if (!moduleKey) {
        console.warn(`  ⚠️  Skipping ${jsonFile} - no module_id`);
        continue;
      }

      let moduleId = moduleMap.get(moduleKey);

      // Create module if not exists
      if (!moduleId) {
        const existingModule = await db.module.findFirst({
          where: { title: jsonData.module_title },
        });

        if (existingModule) {
          moduleId = existingModule.id;
        } else {
          const module = await db.module.create({
            data: {
              title: jsonData.module_title,
              courseId: 1,
              order: parseInt(moduleKey.split('-')[1]) || 0,
            },
          });
          moduleId = module.id;
        }

        moduleMap.set(moduleKey, moduleId);
        console.log(`📚 Module: ${jsonData.module_title} (ID: ${moduleId})`);
      }

      // Create lesson
      const existingLesson = await db.lesson.findFirst({
        where: { title: jsonData.title },
      });

      const lesson = existingLesson || await db.lesson.create({
        data: {
          title: jsonData.title,
          content: mdContent,
          moduleId: moduleId,
          type: 'CONTENT',
          duration: jsonData.duration_minutes,
          order: parseInt(jsonData.lesson_id.split('-')[2]) || 0,
        },
      });

      console.log(`  ✅ Lesson: ${jsonData.title}`);

      // Create exercises
      if (jsonData.exercises && Array.isArray(jsonData.exercises)) {
        for (const exercise of jsonData.exercises) {
          const existingExercise = await db.exercise.findFirst({
            where: {
              title: exercise.question,
              lessonId: lesson.id,
            },
          });

          if (!existingExercise) {
            await db.exercise.create({
              data: {
                title: exercise.question,
                description: exercise.question,
                lessonId: lesson.id,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing ${jsonFile}:`, error);
      throw error;
    }
  }

  console.log(`\n✨ Seed completed! Loaded ${jsonFiles.length} lessons`);
  console.log('📊 Module summary:');
  for (const [moduleKey, moduleId] of moduleMap) {
    const lessonCount = await db.lesson.count({
      where: { moduleId },
    });
    console.log(`  ${moduleKey}: ${lessonCount} lessons`);
  }
}

seedAllModules()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
