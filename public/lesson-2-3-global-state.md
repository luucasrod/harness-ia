# LIÇÃO 2.3: Estado Global - Redux/Zustand

## INTRODUÇÃO (5 min)

Context API resolve global state simples (auth, theme). Mas quando você tem:
- Atualizações frequentes (progresso de aluno em tempo real)
- Múltiplos contextos (user, quiz, exercices, feedback)
- Necessidade de debugar transições (DevTools)
- Middleware (logging, persist)

Aí Context fica limitado. Redux e Zustand entram em cena.

---

## CONTEXT API vs REDUX vs ZUSTAND (20 min)

### Quando Context é Suficiente

```typescript
// ✅ Context: Auth simples
const AuthContext = createContext(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(null);
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
```

**Limitações:**
- Re-renderiza toda árvore quando estado muda
- Sem DevTools
- Sem middleware
- Sem seletores otimizados

### Redux: Powerfully Controlled

```typescript
// Redux: complexo, mas robusto
// 1. State centralizado
interface RootState {
  user: User | null;
  exercises: Exercise[];
  quiz: { currentId: string; answers: Record<string, string> };
}

// 2. Actions explícitas
type Action =
  | { type: 'SET_USER'; payload: User }
  | { type: 'FETCH_EXERCISES_START' }
  | { type: 'FETCH_EXERCISES_SUCCESS'; payload: Exercise[] }
  | { type: 'UPDATE_ANSWER'; payload: { questionId: string; answer: string } };

// 3. Reducer puro
function rootReducer(state = initialState, action: Action): RootState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'FETCH_EXERCISES_SUCCESS':
      return { ...state, exercises: action.payload };
    case 'UPDATE_ANSWER':
      return {
        ...state,
        quiz: {
          ...state.quiz,
          answers: { ...state.quiz.answers, [action.payload.questionId]: action.payload.answer }
        }
      };
    default:
      return state;
  }
}

// 4. Store e Provider
const store = createStore(rootReducer);

<Provider store={store}>
  <App />
</Provider>

// 5. Usar em componentes
const mapStateToProps = (state: RootState) => ({
  user: state.user,
  exercises: state.exercises
});

const mapDispatchToProps = {
  setUser: (user: User) => ({ type: 'SET_USER', payload: user })
};

const ExerciseList = connect(mapStateToProps, mapDispatchToProps)(({ exercises, setUser }) => {
  return <div>{exercises.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}</div>;
});
```

**Redux Toolkit** simplifica:

```typescript
import { createSlice, configureStore } from '@reduxjs/toolkit';

// Slice = reducer + actions
const userSlice = createSlice({
  name: 'user',
  initialState: null as User | null,
  reducers: {
    setUser: (state, action) => action.payload,
    logout: (state) => null
  }
});

const quizSlice = createSlice({
  name: 'quiz',
  initialState: { currentId: '', answers: {} as Record<string, string> },
  reducers: {
    updateAnswer: (state, action) => {
      state.answers[action.payload.questionId] = action.payload.answer;
    }
  }
});

const store = configureStore({
  reducer: {
    user: userSlice.reducer,
    quiz: quizSlice.reducer
  }
});

// Usar: mais simples
function QuizContainer() {
  const dispatch = useDispatch();
  const quiz = useSelector(state => state.quiz);
  const user = useSelector(state => state.user);

  return (
    <div>
      <button onClick={() => dispatch(quizSlice.actions.updateAnswer({ ... }))}>
        Submit
      </button>
    </div>
  );
}
```

**Benefícios Redux:**
- Time-travel debugging (voltar estados passados)
- DevTools excelentes
- Middleware (thunk, saga)
- Comunidade grande

**Problema:** Boilerplate (ações, reducers, selectors)

### Zustand: Lightweight e Moderno

```typescript
import { create } from 'zustand';

interface AppStore {
  user: User | null;
  exercises: Exercise[];
  quizAnswers: Record<string, string>;
  
  setUser: (user: User | null) => void;
  setExercises: (exercises: Exercise[]) => void;
  updateAnswer: (questionId: string, answer: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  exercises: [],
  quizAnswers: {},
  
  setUser: (user) => set({ user }),
  setExercises: (exercises) => set({ exercises }),
  updateAnswer: (questionId, answer) =>
    set((state) => ({
      quizAnswers: { ...state.quizAnswers, [questionId]: answer }
    }))
}));

// Usar: simples e direto
function QuizContainer() {
  const updateAnswer = useAppStore((state) => state.updateAnswer);
  const answers = useAppStore((state) => state.quizAnswers);

  return (
    <div>
      {/* ... */}
      <button onClick={() => updateAnswer('q1', 'answer-a')}>
        Submit
      </button>
    </div>
  );
}
```

**Benefícios Zustand:**
- Sem boilerplate: actions e state em um lugar
- Seletores automáticos (não re-renderiza se setor não muda)
- DevTools via plugin
- TypeScript-friendly
- Lightweight (~1.5KB)

---

## TABELA COMPARATIVA

| Aspecto | Context | Redux | Zustand |
|---------|---------|-------|---------|
| **Tamanho** | Nativo | 40KB+ | 1.5KB |
| **Learning Curve** | Fácil | Médio | Fácil |
| **Boilerplate** | Baixo | Alto | Muito baixo |
| **Performance** | Média (força re-render) | Alta (otimizada) | Alta (seletores) |
| **DevTools** | Não | Excelentes | Via plugin |
| **Middleware** | Não | Sim (thunk, saga) | Sim (via middleware) |
| **Quando usar** | Simples (auth, theme) | Complexo, time grande | Maioria dos casos |

---

## QUANDO NÃO USAR GLOBAL STATE

❌ **Anti-Pattern:** Colocar tudo no store

```typescript
// EVITE: não é global state
const store = create((set) => ({
  formEmail: '',
  formPassword: '',
  setFormEmail: (email) => set({ formEmail: email }),
  // ... state de form específico de um componente
}));
```

✅ **Correto:** State local para componente

```typescript
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Form local, não global
}
```

**Rule:** Global state é para dados compartilhados entre múltiplos componentes/rotas.

---

## EXEMPLO REAL: Zustand na Plataforma

```typescript
interface LearningStore {
  // State
  currentLesson: Lesson | null;
  userProgress: UserProgress | null;
  quizState: { questionId: string; answers: Record<string, string>; isSubmitting: boolean };
  
  // Actions
  setCurrentLesson: (lesson: Lesson) => void;
  setUserProgress: (progress: UserProgress) => void;
  updateQuizAnswer: (questionId: string, answer: string) => void;
  submitQuiz: () => Promise<void>;
  resetQuiz: () => void;
}

export const useLearningStore = create<LearningStore>((set, get) => ({
  currentLesson: null,
  userProgress: null,
  quizState: { questionId: '', answers: {}, isSubmitting: false },
  
  setCurrentLesson: (lesson) => set({ currentLesson: lesson }),
  
  setUserProgress: (progress) => set({ userProgress: progress }),
  
  updateQuizAnswer: (questionId, answer) =>
    set((state) => ({
      quizState: {
        ...state.quizState,
        answers: { ...state.quizState.answers, [questionId]: answer }
      }
    })),
  
  submitQuiz: async () => {
    set((state) => ({
      quizState: { ...state.quizState, isSubmitting: true }
    }));
    
    try {
      const { currentLesson, quizState } = get();
      const result = await gradeQuiz(currentLesson!.id, quizState.answers);
      
      set((state) => ({
        userProgress: { ...state.userProgress!, completedQuizzes: [...state.userProgress!.completedQuizzes, result] },
        quizState: { ...state.quizState, isSubmitting: false }
      }));
    } catch (error) {
      set((state) => ({
        quizState: { ...state.quizState, isSubmitting: false }
      }));
      throw error;
    }
  },
  
  resetQuiz: () => set((state) => ({
    quizState: { questionId: '', answers: {}, isSubmitting: false }
  }))
}));

// Uso em componentes
function QuizPage() {
  const lesson = useLearningStore((state) => state.currentLesson);
  const answers = useLearningStore((state) => state.quizState.answers);
  const updateAnswer = useLearningStore((state) => state.updateQuizAnswer);
  const submitQuiz = useLearningStore((state) => state.submitQuiz);
  
  return (
    <div>
      {lesson && <QuizContainer quiz={lesson.quiz} />}
    </div>
  );
}
```

---

## KEY TAKEAWAYS

1. **Context:** Simples (auth, theme), evita Redux overhead
2. **Redux:** Complexo, timing-travel debugging, comunidade
3. **Zustand:** Moderno, lightweight, bom balanço
4. **Não global state:** State local quando possível (menos acoplamento)
5. **DevTools:** Redux tem excelentes, Zustand via plugin
