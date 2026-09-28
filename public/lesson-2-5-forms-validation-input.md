# LIÇÃO 2.5: Forms, Validation & Input

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

Formulários são onde sistemas encontram usuários reais. Usuários digitam errado, enviam arquivo grande, perdem conexão, deixam campo vazio, colam texto estranho e clicam duas vezes. Um formulário de engineer não é só inputs bonitos: é contrato, validação, feedback e recuperação.

O caso desta lição é envio de exercício na plataforma educacional: aluno responde uma tarefa, pode anexar arquivo, recebe erro útil e o servidor valida tudo novamente.

---

## SEÇÃO 2: CONTROLLED VS UNCONTROLLED (8 minutos)

Controlled inputs guardam valor no estado React.

```typescript
function ControlledAnswer() {
  const [answer, setAnswer] = React.useState("");

  return (
    <textarea
      value={answer}
      onChange={(event) => setAnswer(event.target.value)}
    />
  );
}
```

É simples e explícito, mas cada tecla renderiza o componente. Para formulários grandes, uncontrolled inputs podem ser mais eficientes.

React Hook Form usa filosofia uncontrolled por padrão: registra inputs e lê valores quando necessário.

```typescript
import { useForm } from "react-hook-form";

type ExerciseAnswerForm = {
  answer: string;
};

export function SimpleExerciseForm() {
  const { register, handleSubmit } = useForm<ExerciseAnswerForm>();

  function onSubmit(data: ExerciseAnswerForm) {
    console.log(data.answer);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <textarea {...register("answer")} />
      <button type="submit">Enviar</button>
    </form>
  );
}
```

---

## SEÇÃO 3: REACT HOOK FORM VS FORMIK (8 minutos)

| Critério | React Hook Form | Formik |
|---|---|---|
| Filosofia | Uncontrolled primeiro | Controlled/state central |
| Performance | Geralmente melhor em forms grandes | Pode re-renderizar mais |
| API moderna | Forte com hooks | Popular em legados |
| Integração schema | Boa com resolvers | Boa com Yup |
| Melhor uso | Apps modernos, forms grandes | Codebases existentes com Formik |

Formik não é "errado". Mas para novos projetos React modernos, React Hook Form costuma ser escolha melhor pela ergonomia e performance.

---

## SEÇÃO 4: ZOD E VALIDAÇÃO DUPLA (10 minutos)

Validação client melhora UX. Validação server protege o sistema. Você precisa das duas.

```typescript
import { z } from "zod";

export const exerciseSubmissionSchema = z.object({
  lessonId: z.string().min(1),
  answer: z
    .string()
    .min(40, "Explique sua solução com pelo menos 40 caracteres")
    .max(5000, "A resposta deve ter no máximo 5000 caracteres"),
  confidence: z.enum(["low", "medium", "high"]),
  attachmentUrl: z.string().url().optional()
});

export type ExerciseSubmissionInput = z.infer<typeof exerciseSubmissionSchema>;
```

Client:

```typescript
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm<ExerciseSubmissionInput>({
  resolver: zodResolver(exerciseSubmissionSchema),
  defaultValues: {
    lessonId,
    answer: "",
    confidence: "medium"
  }
});
```

Server:

```typescript
export async function submitExercise(input: unknown) {
  const parsed = exerciseSubmissionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.flatten().fieldErrors
    };
  }

  await saveSubmission(parsed.data);
  return { ok: true };
}
```

Nunca confie no client. O usuário pode desativar JavaScript, alterar request ou chamar sua API diretamente.

---

## SEÇÃO 5: FORM COMPLEXO COM ERROS ÚTEIS (10 minutos)

```typescript
export function ExerciseSubmissionForm({ lessonId }: { lessonId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<ExerciseSubmissionInput>({
    resolver: zodResolver(exerciseSubmissionSchema),
    defaultValues: { lessonId, confidence: "medium" }
  });

  async function onSubmit(values: ExerciseSubmissionInput) {
    const response = await fetch("/api/exercise-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    const result = await response.json();
    if (!response.ok) {
      setError("root", {
        message: result.message ?? "Não foi possível enviar sua resposta."
      });
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="hidden" {...register("lessonId")} />

      <label htmlFor="answer">Sua resposta</label>
      <textarea id="answer" {...register("answer")} />
      {errors.answer && <p role="alert">{errors.answer.message}</p>}

      <label htmlFor="confidence">Confiança</label>
      <select id="confidence" {...register("confidence")}>
        <option value="low">Baixa</option>
        <option value="medium">Média</option>
        <option value="high">Alta</option>
      </select>

      {errors.root && <p role="alert">{errors.root.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}
```

Erro útil diz o que aconteceu e como o usuário pode agir. "Invalid input" não ajuda. "Explique sua solução com pelo menos 40 caracteres" ajuda.

---

## SEÇÃO 6: UPLOAD E MULTI-STEP (8 minutos)

Uploads devem validar tamanho, tipo e falha parcial.

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function validateFile(file: File) {
  if (file.size > MAX_FILE_SIZE) return "Arquivo deve ter até 5MB.";
  if (!["application/pdf", "image/png", "image/jpeg"].includes(file.type)) {
    return "Envie PDF, PNG ou JPEG.";
  }
  return null;
}

async function uploadAttachment(file: File) {
  const error = validateFile(file);
  if (error) throw new Error(error);

  const body = new FormData();
  body.append("file", file);

  const response = await fetch("/api/uploads", { method: "POST", body });
  if (!response.ok) throw new Error("Falha no upload.");
  return (await response.json()) as { url: string };
}
```

Multi-step forms precisam preservar dados e validar por etapa sem esconder erros. Uma boa abordagem é manter schema completo e schemas parciais por etapa.

---

## QUIZ

1. **Multiple choice:** Por que validar no servidor mesmo validando no client?
2. **Short answer:** Quando controlled input é uma boa escolha?
3. **Code review:** O formulário mostra apenas "Erro". O que melhorar?
4. **Prediction:** O que acontece se upload conclui, mas envio final falha?
5. **Multiple choice:** React Hook Form tende a performar bem em forms grandes porque:
   A. Não valida dados.  
   B. Usa uncontrolled inputs por padrão.  
   C. Remove TypeScript.  
   D. Não usa HTML forms.

---

## EXERCÍCIO PRÁTICO

Crie um form de resposta de exercício com validação dupla.

Requisitos: React Hook Form, Zod, campos `answer`, `confidence`, `attachment`; validação server com o mesmo schema; erro por campo; erro global; disabled durante submit; upload com limite de 5MB e tipos permitidos.

## RESUMO

Forms robustos são contratos de entrada. Controlled é explícito; uncontrolled costuma performar melhor em forms grandes. React Hook Form favorece ergonomia moderna. Zod permite schema compartilhado entre client e server. UX de erro é parte da arquitetura: ela reduz fricção e evita dados ruins.
