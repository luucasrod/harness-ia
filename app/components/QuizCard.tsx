'use client';

import { useId, useState } from 'react';

import '@/app/styles/course.css';

export type QuizOption = {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

type QuizCardProps = {
  exercise: QuizOption;
  index: number;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export default function QuizCard({ exercise, index }: QuizCardProps) {
  const fieldsetId = useId();
  const [selection, setSelection] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const hasOptions = Boolean(exercise.options?.length);
  const isCorrect =
    isSubmitted && selection !== null
      ? normalize(selection) === normalize(exercise.correctAnswer)
      : false;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasOptions) {
      return;
    }

    setIsSubmitted(true);
  }

  return (
    <section className="quiz-card rounded-xl bg-ink-raised p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3
          id={fieldsetId}
          className="text-base font-bold leading-6 text-brand-text"
        >
          {exercise.question}
        </h3>
        <span className="shrink-0 rounded-md border border-brand/40 bg-brand/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-brand-text">
          {exercise.type.replace(/_/g, ' ')}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        {hasOptions ? (
          <div role="radiogroup" aria-labelledby={fieldsetId} className="course-stagger grid gap-2">
            {exercise.options?.map((option, optionIndex) => {
              const isSelected = selection === option;
              const state = !isSubmitted
                ? isSelected
                  ? 'selected'
                  : 'idle'
                : normalize(option) === normalize(exercise.correctAnswer)
                  ? 'correct'
                  : isSelected
                    ? 'incorrect'
                    : 'idle';

              return (
                <label
                  key={option}
                  className="quiz-option flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted"
                  data-state={state}
                  style={{ animationDelay: `${optionIndex * 60}ms` }}
                >
                  <input
                    type="radio"
                    name={`${fieldsetId}-option`}
                    value={option}
                    checked={isSelected}
                    disabled={isSubmitted}
                    onChange={() => setSelection(option)}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-brand"
                  />
                  <span>{option}</span>
                  {state === 'correct' ? (
                    <span className="sr-only">Resposta correta</span>
                  ) : null}
                  {state === 'incorrect' ? (
                    <span className="sr-only">Resposta incorreta</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="text-sm leading-6 text-muted">
            Resposta esperada:{' '}
            <span className="font-semibold text-white">
              {exercise.correctAnswer}
            </span>
          </p>
        )}

        {hasOptions ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={selection === null || isSubmitted}
              className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 ease-out-soft hover:scale-[1.02] hover:bg-brand-strong active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitted ? 'Resposta enviada' : 'Verificar resposta'}
            </button>

            {isSubmitted ? (
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setSelection(null);
                }}
                className="rounded-lg border border-line px-4 py-2.5 text-sm font-semibold text-muted transition-colors duration-200 hover:border-line-strong hover:text-white"
              >
                Tentar de novo
              </button>
            ) : null}
          </div>
        ) : null}
      </form>

      {isSubmitted ? (
        <div
          role="status"
          className="quiz-card__feedback mt-4 rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-6"
        >
          <p
            className={`font-semibold ${isCorrect ? 'text-emerald-300' : 'text-danger'}`}
          >
            {isCorrect ? 'Isso mesmo!' : 'Ainda não é essa.'}
          </p>
          <p className="mt-1 text-muted">{exercise.explanation}</p>
        </div>
      ) : null}

      <span className="sr-only">Questão {index + 1}</span>
    </section>
  );
}
