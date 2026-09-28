# LIÇÃO 2.3: Estado Global - Context API, Redux Toolkit e Zustand

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

Estado global é uma ferramenta poderosa e perigosa. Poderosa porque remove duplicação e mantém partes distantes da UI sincronizadas. Perigosa porque vira lixeira compartilhada quando a equipe coloca qualquer dado "conveniente" ali.

Engineer não pergunta "qual biblioteca está na moda?". Pergunta: quem precisa desse estado, com que frequência ele muda, como será depurado, como será testado e qual é o custo de acoplamento?

Nesta lição, vamos usar um caso único em três implementações: progresso do aluno no LMS. Dashboard, sidebar de módulos e página da lição precisam saber quais aulas foram concluídas e qual é o próximo passo recomendado.

---

## SEÇÃO 2: QUANDO NÃO USAR ESTADO GLOBAL (8 minutos)

Antes de escolher Redux ou Zustand, tente remover a necessidade.

```typescript
function LessonPage({ lesson }: { lesson: Lesson }) {
  const completed = lesson.completedAt !== null;
  return <LessonContent lesson={lesson} completed={completed} />;
}
```

Se o dado vem do servidor e é usado por uma rota específica, talvez ele pertença ao carregamento daquela rota. Se é apenas estado de formulário, provavelmente pertence ao formulário. Se é estado de UI local, como modal aberto, mantenha perto de onde é usado.

Use estado global quando:

- Muitas áreas distantes precisam do mesmo dado.
- O estado precisa sobreviver a navegação.
- Há fluxo de atualização compartilhado.
- Debugging temporal importa.
- A equipe precisa de convenções fortes.

---

## SEÇÃO 3: CONTEXT API (10 minutos)

Context é a opção nativa. Para progresso simples, pode ser suficiente.

```typescript
type ProgressState = {
  completedLessonIds: string[];
  currentModuleId: string;
};

type ProgressContextValue = {
  state: ProgressState;
  markCompleted: (lessonId: string) => void;
};

const ProgressContext = React.createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ProgressState>({
    completedLessonIds: [],
    currentModuleId: "module-1"
  });

  const markCompleted = React.useCallback((lessonId: string) => {
    setState((current) => ({
      ...current,
      completedLessonIds: Array.from(new Set([...current.completedLessonIds, lessonId]))
    }));
  }, []);

  const value = React.useMemo(() => ({ state, markCompleted }), [state, markCompleted]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress() {
  const context = React.useContext(ProgressContext);
  if (!context) throw new Error("useProgress deve ser usado dentro de ProgressProvider");
  return context;
}
```

Context é ótimo para começar. O limite aparece quando você precisa de DevTools, selectors, middlewares, persistência robusta ou atualizações frequentes com muitos consumidores.

---

## SEÇÃO 4: REDUX TOOLKIT (12 minutos)

Redux tem três princípios: uma fonte de verdade, mudanças via ações e atualização por reducers puros. O Redux clássico era verboso. Redux Toolkit remove muito boilerplate e deve ser a escolha padrão se você usa Redux hoje.

```typescript
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type ProgressState = {
  completedLessonIds: string[];
  currentModuleId: string | null;
};

const initialState: ProgressState = {
  completedLessonIds: [],
  currentModuleId: null
};

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    moduleOpened(state, action: PayloadAction<string>) {
      state.currentModuleId = action.payload;
    },
    lessonCompleted(state, action: PayloadAction<string>) {
      if (!state.completedLessonIds.includes(action.payload)) {
        state.completedLessonIds.push(action.payload);
      }
    }
  }
});

export const { moduleOpened, lessonCompleted } = progressSlice.actions;
export const progressReducer = progressSlice.reducer;
```

Selectors isolam leitura:

```typescript
type RootState = {
  progress: ProgressState;
};

export function selectCompletedCount(state: RootState) {
  return state.progress.completedLessonIds.length;
}

export function selectIsLessonCompleted(lessonId: string) {
  return (state: RootState) => state.progress.completedLessonIds.includes(lessonId);
}
```

Uso no componente:

```typescript
function CompleteLessonButton({ lessonId }: { lessonId: string }) {
  const dispatch = useAppDispatch();
  const completed = useAppSelector(selectIsLessonCompleted(lessonId));

  return (
    <button disabled={completed} onClick={() => dispatch(lessonCompleted(lessonId))}>
      {completed ? "Concluída" : "Marcar como concluída"}
    </button>
  );
}
```

Redux brilha quando fluxos são complexos, várias equipes mexem no mesmo domínio e debugging com histórico de ações economiza tempo.

---

## SEÇÃO 5: ZUSTAND (10 minutos)

Zustand é menor e direto. A store é um hook.

```typescript
import { create } from "zustand";

type ProgressStore = {
  completedLessonIds: string[];
  currentModuleId: string | null;
  moduleOpened: (moduleId: string) => void;
  lessonCompleted: (lessonId: string) => void;
};

export const useProgressStore = create<ProgressStore>((set) => ({
  completedLessonIds: [],
  currentModuleId: null,
  moduleOpened: (moduleId) => set({ currentModuleId: moduleId }),
  lessonCompleted: (lessonId) =>
    set((state) => ({
      completedLessonIds: state.completedLessonIds.includes(lessonId)
        ? state.completedLessonIds
        : [...state.completedLessonIds, lessonId]
    }))
}));
```

Uso:

```typescript
function ProgressBadge() {
  const completedCount = useProgressStore((state) => state.completedLessonIds.length);
  return <span>{completedCount} lições concluídas</span>;
}
```

Zustand é excelente para apps pequenos e médios, protótipos sérios e estados globais com API clara. O risco é a liberdade excessiva: sem convenções, cada store vira um estilo diferente.

---

## SEÇÃO 6: COMPARAÇÃO

| Critério | Context API | Redux Toolkit | Zustand |
|---|---|---|---|
| Boilerplate | Baixo | Médio | Baixo |
| Curva de aprendizado | Baixa | Média | Baixa |
| DevTools | Limitado | Excelente | Bom com middleware |
| Escalabilidade de equipe | Média | Alta | Média |
| Bundle/complexidade | Nativo | Maior | Pequeno |
| Melhor uso | Auth, tema, estado simples | Domínio complexo, auditoria de ações | Estado global leve e pragmático |

Decisão prática:

```text
O estado é local? mantenha local.
Vem do servidor? use cache/fetching por rota quando possível.
É global simples e pouco mutável? Context.
É domínio complexo com muitos eventos? Redux Toolkit.
É global leve com ergonomia rápida? Zustand.
```

---

## SEÇÃO 7: DEVTOOLS E DEBUGGING (5 minutos)

Estado global sem debugging é dívida. Em Redux, nomeie ações como eventos de domínio: `lessonCompleted`, `moduleOpened`, `tutorFeedbackSubmitted`. Em Zustand, use middleware de devtools quando o fluxo começa a ficar importante.

Não faça debugging olhando só a tela. Inspecione: ação disparada, payload, estado anterior, estado novo e componente afetado.

---

## QUIZ

1. **Multiple choice:** Qual é o primeiro passo antes de adotar estado global?  
   A. Instalar Redux.  
   B. Verificar se o estado pode continuar local ou vir do servidor.  
   C. Criar um Context único para tudo.  
   D. Memorizar todos os selectors.

2. **Short answer:** Por que selectors são importantes em Redux?

3. **Code review:** Uma store global guarda `isModalOpen` de um modal usado em uma única tela. O que você recomenda?

4. **Prediction:** Se um Context Provider passa `{ state, markCompleted }` sem `useMemo`, consumidores podem re-renderizar mais? Por quê?

5. **Multiple choice:** Redux Toolkit é mais indicado quando:  
   A. O estado é um input local.  
   B. Há domínio complexo, muitos eventos e necessidade forte de debugging.  
   C. Você quer evitar qualquer convenção.  
   D. O app tem apenas um botão.

---

## EXERCÍCIO PRÁTICO

Implemente uma store Redux Toolkit para progresso de aluno.

Requisitos: actions `moduleOpened`, `lessonCompleted`, `lessonReset`; selectors `selectCompletedCount`, `selectModuleProgressPercentage`, `selectNextLesson`; testes para evitar duplicação de lição concluída; integração em um componente `ModuleProgressSidebar`.

## RESUMO

Estado global é arquitetura compartilhada. Context é suficiente para muitos casos, mas não para todos. Redux Toolkit entrega previsibilidade e depuração forte para domínios complexos. Zustand entrega simplicidade e ergonomia. A decisão madura começa perguntando se o estado deveria ser global.
