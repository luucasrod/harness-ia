import { readFile } from "node:fs/promises";
import { join } from "node:path";

type LessonExample = {
  title: string;
  description: string;
  code_or_diagram: string;
};

type LessonExercise = {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correct_answer: string;
  explanation: string;
};

type Lesson = {
  lesson_id: string;
  title: string;
  description: string;
  learning_objectives: string[];
  content: string;
  examples?: LessonExample[];
  exercises?: LessonExercise[];
};

type ModuleContent = {
  module_id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

export const dynamic = "force-dynamic";

async function readModuleContent(): Promise<ModuleContent> {
  const filePath = join(process.cwd(), "public", "module-1-content.json");
  const rawContent = await readFile(filePath, "utf8");
  const jsonStart = rawContent.indexOf('{\n  "module_id"');
  const jsonEnd = rawContent.lastIndexOf("}");

  if (jsonStart < 0 || jsonEnd < jsonStart) {
    throw new Error("Module content JSON payload was not found.");
  }

  return JSON.parse(rawContent.slice(jsonStart, jsonEnd + 1)) as ModuleContent;
}

export async function GET(
  _request: Request,
  context: RouteContext<
    "/api/courses/[courseId]/modules/[moduleId]/lessons/[lessonId]"
  >,
) {
  const { courseId, moduleId, lessonId } = await context.params;
  const moduleContent = await readModuleContent();
  const lessonIndex = moduleContent.lessons.findIndex(
    (lesson) => lesson.lesson_id === lessonId,
  );

  if (lessonIndex === -1) {
    return Response.json({ message: "Lesson not found" }, { status: 404 });
  }

  const lesson = moduleContent.lessons[lessonIndex];
  const previousLesson = moduleContent.lessons[lessonIndex - 1];
  const nextLesson = moduleContent.lessons[lessonIndex + 1];

  return Response.json({
    course: {
      id: courseId,
      title: "AI Engineering Foundations",
    },
    module: {
      id: moduleId,
      sourceId: moduleContent.module_id,
      title: moduleContent.title,
      description: moduleContent.description,
    },
    lesson,
    outline: moduleContent.lessons.map((moduleLesson, index) => ({
      id: moduleLesson.lesson_id,
      title: moduleLesson.title,
      description: moduleLesson.description,
      order: index + 1,
      isCurrent: moduleLesson.lesson_id === lessonId,
      href: `/courses/${courseId}/modules/${moduleId}/lessons/${moduleLesson.lesson_id}`,
    })),
    navigation: {
      previous: previousLesson
        ? {
            id: previousLesson.lesson_id,
            title: previousLesson.title,
            href: `/courses/${courseId}/modules/${moduleId}/lessons/${previousLesson.lesson_id}`,
          }
        : null,
      next: nextLesson
        ? {
            id: nextLesson.lesson_id,
            title: nextLesson.title,
            href: `/courses/${courseId}/modules/${moduleId}/lessons/${nextLesson.lesson_id}`,
          }
        : null,
    },
  });
}
