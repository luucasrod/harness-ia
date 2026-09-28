# LIÇÃO 2.5: Forms, Validation & Input

## INTRODUÇÃO (5 min)

Formulários parecem simples. Mas em produção: validação client, validação server, UX de erros, upload de arquivo, multi-step, debounce, submissão durante validação.

React Hook Form simplifica. Zod torna validação type-safe.

---

## REACT HOOK FORM vs FORMIK (8 min)

### Formik: Verbose mas Robusto

```typescript
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string().email().required(),
  password: Yup.string().min(6).required()
});

function LoginForm() {
  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      validationSchema={validationSchema}
      onSubmit={async (values) => {
        await authenticateUser(values);
      }}
    >
      <Form>
        <Field name="email" type="email" />
        <ErrorMessage name="email" />
        <Field name="password" type="password" />
        <ErrorMessage name="password" />
        <button type="submit">Login</button>
      </Form>
    </Formik>
  );
}
```

### React Hook Form: Minimal

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type LoginFormData = z.infer<typeof schema>;

function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(async (data) => {
      await authenticateUser(data);
    })}>
      <input {...register('email', { required: true })} />
      {errors.email && <span>{errors.email.message}</span>}
      <input {...register('password', { required: true })} type="password" />
      {errors.password && <span>{errors.password.message}</span>}
      <button type="submit">Login</button>
    </form>
  );
}
```

| Aspecto | Formik | React Hook Form |
|---------|--------|-----------------|
| **Bundle** | Maior | Menor |
| **Re-renders** | Frequente | Otimizado |
| **Learning** | Médio | Fácil |
| **Validação** | Yup/Joi | Zod (type-safe) |

---

## CLIENT + SERVER VALIDATION (10 min)

### Client: Feedback rápido

```typescript
// Client valida enquanto digita
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres')
});

function LoginForm() {
  const { register, handleSubmit, formState: { errors, isValidating } } = useForm({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span className="error">{errors.email.message}</span>}
      {isValidating && <span>Validando...</span>}
    </form>
  );
}
```

### Server: Segurança

```typescript
// app/api/login/route.ts (Server Action)
'use server';

import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function login(data: unknown) {
  const parsed = schema.safeParse(data);
  
  if (!parsed.success) {
    return { error: 'Validação falhou', errors: parsed.error.flatten() };
  }

  // Valida no banco, checa senha, etc
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !await verifyPassword(parsed.data.password, user.hash)) {
    return { error: 'Email ou senha inválidos' };
  }

  return { success: true, user };
}
```

### Usar em Formulário

```typescript
function LoginForm() {
  const [serverError, setServerError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(clientSchema)
  });

  const onSubmit = async (data) => {
    const result = await login(data); // Server Action

    if (result.error) {
      setServerError(result.error);
    } else {
      // Sucesso
      redirectToDashboard();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {serverError && <div className="error">{serverError}</div>}
      {/* ... fields ... */}
    </form>
  );
}
```

---

## FILE UPLOADS & DRAG-DROP (7 min)

```typescript
function ExerciseSubmissionForm() {
  const { register, watch, formState: { errors } } = useForm();
  const [dragActive, setDragActive] = useState(false);

  const fileInput = watch('file');

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      registerField('file', { value: files[0] });
    }
  };

  const validateFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) return 'Máximo 10MB';
    if (!['application/pdf', 'image/png'].includes(file.type)) {
      return 'Só PDF e PNG';
    }
    return true;
  };

  return (
    <form>
      <div
        className={dragActive ? 'drag-active' : ''}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          {...register('file', {
            validate: (file) => !file || validateFile(file)
          })}
          type="file"
          accept=".pdf,.png"
        />
        {errors.file && <span>{errors.file.message}</span>}
      </div>
    </form>
  );
}
```

---

## MULTI-STEP FORMS (8 min)

```typescript
function MultiStepForm() {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, formState, watch } = useForm({
    mode: 'onChange' // Valida em tempo real
  });

  const data = watch();

  const isStepValid = step === 1
    ? data.email && !formState.errors.email
    : data.password && !formState.errors.password;

  return (
    <form>
      {step === 1 && (
        <div>
          <input {...register('email', { required: true })} placeholder="Email" />
          <button
            onClick={() => setStep(2)}
            disabled={!isStepValid}
          >
            Próximo
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <input {...register('password', { required: true })} type="password" placeholder="Senha" />
          <button onClick={() => setStep(1)}>Voltar</button>
          <button onClick={handleSubmit(onSubmit)} disabled={!isStepValid}>
            Enviar
          </button>
        </div>
      )}
    </form>
  );
}
```

---

## ZOD SCHEMAS (5 min)

```typescript
import { z } from 'zod';

// Type-safe schema
const exerciseSubmissionSchema = z.object({
  exerciseId: z.string().uuid(),
  answer: z.string().min(1, 'Resposta obrigatória'),
  file: z.instanceof(File).optional(),
  explanation: z.string().max(500).optional(),
  timestamp: z.date().default(() => new Date())
});

// Infere TypeScript type automaticamente
type ExerciseSubmission = z.infer<typeof exerciseSubmissionSchema>;

// Validar dados
const result = exerciseSubmissionSchema.safeParse({
  exerciseId: '123',
  answer: 'answer text'
});

if (!result.success) {
  console.error(result.error.flatten());
} else {
  console.log(result.data); // Type-safe
}
```

---

## KEY TAKEAWAYS

1. **React Hook Form:** Simpler que Formik, menos re-renders
2. **Zod:** Type-safe validation, schemas compostos
3. **Client + Server:** Client rápido, server seguro
4. **Drag-drop:** UX melhor pra uploads
5. **Multi-step:** Validação por passo
