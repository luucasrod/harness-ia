# LIÇÃO 2.2: Hooks Profundo - useReducer, Context, Custom Hooks

## INTRODUÇÃO (8 min)

Hooks modernizaram React. Mas muitos developers copiam patterns sem entender trade-offs.

`useState` é ótimo para state simples. Mas quando seu exercício tem: loading, error, retry count, cache, feedback de IA... `useState` vira spaghetti de 10+ variáveis interdependentes.

`useContext` parece resolver global state, mas sem organização vira prop drilling distribuído.

`useCallback` e `useMemo` parecem mágicos, mas aplicados errado são overhead puro.

Esta lição te ensina quando usar cada um e por quê.

---

## SEÇÃO 1: useState vs useReducer (12 min)

### useState: Simples, Mas Limitado

```typescript
function QuizQuestion({ questionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Múltiplas dependências lógicas
  const canSubmit = !loading && !isSubmitting && selectedAnswer && !result;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await gradeAnswer(questionId, selectedAnswer);
      setResult(res);
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };
}
```

**Problema:** Estado é distribuído. Regras lógicas (como `canSubmit`) precisam ser computadas no componente. Difícil raciocinar sobre estado válido.

### useReducer: Centralizado e Previsível

```typescript
interface QuizState {
  loading: boolean;
  error: string | null;
  question: Question | null;
  selectedAnswer: string;
  isSubmitting: boolean;
  result: GradeResult | null;
}

type QuizAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Question }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SELECT_ANSWER'; payload: string }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: GradeResult }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: QuizState = {
  loading: true,
  error: null,
  question: null,
  selectedAnswer: '',
  isSubmitting: false,
  result: null
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { ...state, loading: false, question: action.payload };
    case 'SELECT_ANSWER':
      return { ...state, selectedAnswer: action.payload, result: null };
    case 'SUBMIT_START':
      return { ...state, isSubmitting: true, error: null };
    case 'SUBMIT_SUCCESS':
      return { ...state, isSubmitting: false, result: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function QuizQuestion({ questionId }: Props) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  useEffect(() => {
    dispatch({ type: 'FETCH_START' });
    fetchQuestion(questionId)
      .then(q => dispatch({ type: 'FETCH_SUCCESS', payload: q }))
      .catch(err => dispatch({ type: 'FETCH_ERROR', payload: err.message }));
  }, [questionId]);

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' });
    try {
      const res = await gradeAnswer(questionId, state.selectedAnswer);
      dispatch({ type: 'SUBMIT_SUCCESS', payload: res });
    } catch (err) {
      dispatch({ type: 'SUBMIT_ERROR', payload: err.message });
    }
  };

  const canSubmit = !state.loading && !state.isSubmitting && state.selectedAnswer && !state.result;

  return (
    <div>
      {state.loading && <Spinner />}
      {state.error && <ErrorMessage error={state.error} />}
      {state.question && (
        <>
          <QuestionDisplay question={state.question} />
          <button onClick={handleSubmit} disabled={!canSubmit}>
            {state.isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </>
      )}
      {state.result && <ResultDisplay result={state.result} />}
    </div>
  );
}
```

**Benefícios:**
- Estado é centralizado: um `QuizState` descreve toda a máquina de estados
- Transições são explícitas: `FETCH_START` → `FETCH_SUCCESS` ou `FETCH_ERROR`
- Regras lógicas (`canSubmit`) computam sobre state único
- Testável: reducer é função pura

**Quando usar:**
- Estado com múltiplas variáveis interdependentes
- Transições complexas (loading → error → retry → success)
- Necessidade de debugar qual ação causou problema

**Quando usar `useState`:**
- State simples: `isOpen`, `count`, `email`
- Sem interdependências

---

## SEÇÃO 2: useContext + Custom Hooks (15 min)

### useContext: Global State Sem Redux

```typescript
// 1. Criar Context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 2. Provider (gerencia estado global)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão ao montar
    checkSession().then(setUser).finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const u = await authenticateUser(email, password);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    clearSession();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom Hook (torna fácil usar)
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve estar dentro AuthProvider');
  return context;
}

// 4. Usar em qualquer componente
function UserProfile() {
  const { user, logout } = useAuth();
  
  if (!user) return <Redirect to="/login" />;
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Quando é suficiente:**
- Auth global (user, login, logout)
- UI global (theme, language)
- Dados que não mudam frequentemente

**Quando precisa de Redux/Zustand:**
- Atualizações frequentes (lista de exercícios em tempo real)
- Múltiplos contextos criando aninhamento profundo
- Precisa de middleware (logging, persistence)
- Precisa de DevTools

---

## SEÇÃO 3: Custom Hooks (12 min)

### Reutilizar Lógica Stateful

```typescript
// ❌ ANTES: Lógica de fetch duplicada em 10 componentes
function ExerciseList() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetchExercises()
      .then(setExercises)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return ...;
}

// ✅ DEPOIS: Custom Hook reutiliza a lógica
function useFetch<T>(url: string): {
  data: T | null;
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const result = await response.json();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true; // Cleanup: previne memory leak se componente desmontar
    };
  }, [url]);

  return { data, loading, error };
}

// Uso em qualquer componente
function ExerciseList() {
  const { data: exercises, loading, error } = useFetch<Exercise[]>('/api/exercises');
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return exercises?.map(ex => <ExerciseCard key={ex.id} exercise={ex} />);
}

function QuizList() {
  const { data: quizzes, loading, error } = useFetch<Quiz[]>('/api/quizzes');
  // ... mesmo padrão
}
```

**Boas práticas de custom hooks:**
1. **Nome com `use`:** `useAuth`, `useFetch`, `useLocalStorage`
2. **Retorna estado ou callbacks:** `{ data, loading, error }` ou função
3. **Cleanup:** Use return de useEffect para limpar (cancel requests, timers)
4. **Sem side effects na raiz:** Hooks não devem chamar APIs na raiz, dentro useEffect

---

## SEÇÃO 4: useEffect Pitfalls (13 min)

### Armadilha 1: Dependências Erradas

```typescript
// ❌ ANTI-PATTERN: Sem dependências, fetch roda toda renderização
function ExerciseDetail({ exerciseId }: Props) {
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    fetchExercise(exerciseId).then(setExercise); // Roda infinitamente!
  }); // ← Falta array de dependências
}

// ✅ CORRETO: Array de dependências
useEffect(() => {
  fetchExercise(exerciseId).then(setExercise);
}, [exerciseId]); // ← Roda só quando exerciseId muda
```

### Armadilha 2: Race Conditions

```typescript
// ❌ PROBLEMA: Requisições lentas podem vir fora de ordem
function SearchExercises({ query }: Props) {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchExercises(query).then(setResults);
  }, [query]); // User digita "a" (fetch lento), depois "ab" (fetch rápido)
  // "ab" chega antes de "a", results fica com dados da busca anterior
}

// ✅ SOLUÇÃO: Cleanup função cancela requisição anterior
useEffect(() => {
  let cancelled = false;

  const search = async () => {
    const data = await fetchExercises(query);
    if (!cancelled) setResults(data); // Ignora se componente desmontar
  };

  search();

  return () => {
    cancelled = true; // Cleanup: próximo efeito cancela anterior
  };
}, [query]);
```

### Armadilha 3: Stale Closures

```typescript
// ❌ PROBLEMA: callback usa valor "stale" de state
function QuizCard({ exerciseId }: Props) {
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const handleSubmit = () => {
    submitAnswer(exerciseId, selectedAnswer); // Qual é selectedAnswer?
  };

  return (
    <div>
      <input onChange={(e) => setSelectedAnswer(e.target.value)} />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}

// ✅ SOLUÇÃO: useCallback com dependências corretas
const handleSubmit = useCallback(() => {
  submitAnswer(exerciseId, selectedAnswer);
}, [exerciseId, selectedAnswer]); // ← selectedAnswer como dependência
```

---

## SEÇÃO 5: useMemo e useCallback (10 min)

### Quando Realmente Ajudam

```typescript
// ❌ OVERHEAD: useMemo em cálculo barato
function ExerciseList({ exercises }: Props) {
  const sorted = useMemo(
    () => exercises.sort((a, b) => a.title.localeCompare(b.title)),
    [exercises]
  ); // Sort é <1ms, overhead de memoization é overhead puro
}

// ✅ BENEFÍCIO: useMemo em cálculo caro
function ResultsPage({ exercises, filters }: Props) {
  const filteredAndSorted = useMemo(() => {
    return exercises
      .filter(ex => filters.every(f => f.matches(ex))) // 10.000 items × filters
      .map(ex => ({ ...ex, score: complexCalculation(ex) })) // Caro
      .sort((a, b) => b.score - a.score);
  }, [exercises, filters]); // Memoiza: se exercises/filters não mudam, não recalcula
}

// ✅ BENEFÍCIO: useCallback com componentes memoizados
function TeacherDashboard() {
  const [students, setStudents] = useState([]);

  const handleStudentUpdate = useCallback((id: string, data: StudentData) => {
    setStudents(s => s.map(st => st.id === id ? { ...st, ...data } : st));
  }, []); // ← Callback estável

  return (
    <StudentList
      students={students}
      onUpdate={handleStudentUpdate}
    /> // ← Memoizado: se handleStudentUpdate não muda, lista não re-renderiza
  );
}
```

**Regra:** Meça antes de otimizar. Use React DevTools Profiler, não adivinhação.

---

## EXEMPLO REAL: Tutor de IA com Estado Complexo

```typescript
type TutorState = {
  exercise: Exercise | null;
  userAnswer: string;
  loading: boolean;
  explanation: string | null;
  feedback: Feedback | null;
  retryCount: number;
};

type TutorAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: Exercise }
  | { type: 'UPDATE_ANSWER'; payload: string }
  | { type: 'EXPLAIN_START' }
  | { type: 'EXPLAIN_SUCCESS'; payload: string }
  | { type: 'EXPLAIN_RETRY' };

function TutorContainer({ exerciseId }: Props) {
  const [state, dispatch] = useReducer(tutorReducer, initialState);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const loadExercise = async () => {
      dispatch({ type: 'FETCH_START' });
      try {
        const ex = await fetchExercise(exerciseId);
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: ex });
      } catch (err) {
        // Handle error
      }
    };

    loadExercise();
    return () => { cancelled = true; };
  }, [exerciseId]);

  const handleExplain = useCallback(async () => {
    dispatch({ type: 'EXPLAIN_START' });
    try {
      const exp = await aiTutorService.explain({
        exerciseId,
        userAnswer: state.userAnswer,
        userId: user!.id
      });
      dispatch({ type: 'EXPLAIN_SUCCESS', payload: exp });
    } catch (err) {
      dispatch({ type: 'EXPLAIN_RETRY' });
    }
  }, [state.userAnswer, exerciseId, user]);

  return (
    <TutorPresentation
      state={state}
      onAnswerChange={(ans) => dispatch({ type: 'UPDATE_ANSWER', payload: ans })}
      onExplain={handleExplain}
    />
  );
}
```

---

## RESUMO

| Hook | Use para | Evite se |
|------|----------|----------|
| **useState** | State simples | Interdependências complexas |
| **useReducer** | Estado complexo, transições | State simples |
| **useContext** | Global state simples | Atualizações frequentes |
| **useMemo** | Cálculo caro (>5ms) | Cálculos baratos (<1ms) |
| **useCallback** | Passar callback a memoized child | Callback nunca usado como prop |

---

## KEY TAKEAWAYS

1. **useReducer:** Use quando state tem múltiplas variáveis ou transições complexas
2. **useContext:** Simples, ideal para auth/theme. Redux/Zustand para más complexa
3. **Custom Hooks:** Reutilize lógica stateful sem copiar código
4. **useEffect:** Dependências corretas, cleanup, race conditions
5. **Memoização:** Meça antes, não otimize prematuramente
