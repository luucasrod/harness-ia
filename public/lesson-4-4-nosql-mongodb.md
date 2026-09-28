# LIÇÃO 4.4: NoSQL (MongoDB)

## SEÇÃO 1-2: INTRODUÇÃO E MODELO DOCUMENTO (10 minutos)

### Quando NoSQL?

NoSQL não substitui SQL — resolve problema diferente. Relacional é forte em *estrutura e transações*. Documento é forte em *flexibilidade e escala horizontal*.

**Relacional:** Estrutura rígida, schema-on-write, normalized
**Documento (MongoDB):** Flexível, schema-on-read, denormalized

Use NoSQL quando:
- Dados não têm estrutura fixa (ex: eventos variáveis)
- Precisa escalar horizontalmente (sharding)
- Velocidade de escrita importa (menos joins)
- Estrutura evolui frequentemente

**Não use quando:**
- Precisa transações ACID multi-documento (SQL é melhor)
- Dados muito relacionados (normalizados é caro em NoSQL)
- Relatórios complexos (SQL é transparente)

### Documento vs Relacional

```javascript
// MONGODB (denormalized)
db.lessons.insertOne({
  _id: ObjectId("..."),
  title: "Algoritmos",
  module: {
    id: ObjectId("..."),
    name: "Estruturas"
  },
  questions: [
    { id: ObjectId("..."), text: "O que é recursão?" },
    { id: ObjectId("..."), text: "Exemplos de recursão?" }
  ]
});

// SQL (normalized)
INSERT INTO lessons VALUES (id, "Algoritmos", moduleId);
INSERT INTO modules VALUES (moduleId, "Estruturas");
INSERT INTO questions VALUES (qId1, lessonId, "O que é recursão?");
INSERT INTO questions VALUES (qId2, lessonId, "Exemplos de recursão?");
```

---

## SEÇÃO 3: ÍNDICES E QUERIES (12 minutos)

### CRUD com MongoDB

```javascript
// Create
db.users.insertOne({
  email: "student@example.com",
  name: "Alice",
  createdAt: new Date()
});

// Read
db.users.findOne({ email: "student@example.com" });
db.lessons.find({ difficulty: "advanced" }).limit(10).sort({ createdAt: -1 });

// Update
db.users.updateOne(
  { _id: ObjectId("...") },
  { $set: { name: "Bob", updatedAt: new Date() } }
);

// Delete
db.users.deleteOne({ _id: ObjectId("...") });
```

### Índices em MongoDB

```javascript
// Single-field index
db.users.createIndex({ email: 1 });
db.lessons.createIndex({ difficulty: 1 });

// Compound index
db.userProgress.createIndex({ userId: 1, status: 1 });

// Full-text index
db.lessons.createIndex({ title: "text", content: "text" });
db.lessons.find({ $text: { $search: "algoritmo" } });

// Sparse index (só documentos com campo)
db.users.createIndex({ email: 1 }, { sparse: true });
```

---

## SEÇÃO 4: TRANSAÇÕES E ATOMICIDADE (12 minutos)

### Atomicidade em Documento

Operações dentro um documento são atômicas. Sem documento, não é.

```javascript
// ATÔMICO: Operação única em documento
db.userProgress.updateOne(
  { userId: "user1", lessonId: "lesson1" },
  {
    $set: { status: "completed" },
    $inc: { progressPercentage: 100 },
    $currentDate: { completedAt: true }
  }
);
// Tudo acontece junto; sem risco de inconsistência

// NÃO ATÔMICO: Múltiplos documentos sem transação
db.users.updateOne({ _id: "user1" }, { $inc: { completedLessons: 1 } });
db.lessons.updateOne({ _id: "lesson1" }, { $inc: { completions: 1 } });
// Se cair entre, fica inconsistente
```

### Transações Multi-Documento (MongoDB 4.0+)

```javascript
// Transação (similar a SQL BEGIN/COMMIT)
session = db.getMongo().startSession();
session.startTransaction();

try {
  db.users.updateOne(
    { _id: "user1" },
    { $inc: { balance: -100 } },
    { session }
  );
  db.wallets.updateOne(
    { _id: "wallet1" },
    { $inc: { balance: +100 } },
    { session }
  );
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
}
```

**Limitações:** Transações em MongoDB são lentas (por replicação). Prefira atomicidade em documento (denormalize).

---

## SEÇÃO 5: DENORMALIZAÇÃO vs NORMALIZAÇÃO (12 minutos)

### Quando Denormalizar (MongoDB)

Embebendo dados relacionados em um documento:

```javascript
// DENORMALIZADO (comum em MongoDB)
db.userProgress.insertOne({
  userId: "user1",
  lesson: {
    id: "lesson1",
    title: "Algoritmos",
    module: "Estruturas",
    difficulty: "advanced"
  },
  answers: [
    { questionId: "q1", isCorrect: true, timestamp: Date() },
    { questionId: "q2", isCorrect: false, timestamp: Date() }
  ],
  progressPercentage: 75
});

// Vantagem: query única sem joins
db.userProgress.findOne({ userId: "user1" });
// Traz lesson + answers tudo junto

// Problema: duplicação. Se lesson muda, precisa atualizar multidocs
db.userProgress.updateMany(
  { "lesson.id": "lesson1" },
  { $set: { "lesson.title": "Algoritmos Avançados" } }
);
```

### Quando Manter Referência (SQL-style)

```javascript
// NORMALIZADO
db.userProgress.insertOne({
  userId: "user1",
  lessonId: "lesson1", // Apenas ID
  progressPercentage: 75
});

db.lessons.insertOne({
  _id: ObjectId("lesson1"),
  title: "Algoritmos",
  module: "Estruturas",
  difficulty: "advanced"
});

// Query precisa de lookup (join)
db.userProgress.aggregate([
  { $match: { userId: "user1" } },
  {
    $lookup: {
      from: "lessons",
      localField: "lessonId",
      foreignField: "_id",
      as: "lesson"
    }
  }
]);
```

**Regra prática:**
- Dados que mudam frequentemente: referência (evita atualizar multidocs)
- Dados que leem frequentemente junto: denormalize (1 query em vez de join)

---

## SEÇÃO 6: ANTI-PATTERNS (8 minutes)

### Problema: Subdocumento Crescente Sem Limite

```javascript
// RUIM: Array pode crescer indefinidamente
db.lessons.insertOne({
  _id: ObjectId("lesson1"),
  title: "Algoritmos",
  completions: [
    { userId: "user1", date: Date() },
    { userId: "user2", date: Date() },
    // ... 1M de usuários = documento gigante
  ]
});

// Melhor: Usar coleção separada
db.lessonCompletions.insertOne({
  lessonId: ObjectId("lesson1"),
  userId: "user1",
  date: Date()
});
// Coleção cresce, não documentos individuais
```

### Problema: Sem Índice em Queries Frequentes

```javascript
// RUIM
db.users.find({ email: "user@example.com" }); // Full collection scan

// BOM
db.users.createIndex({ email: 1 });
db.users.findOne({ email: "user@example.com" }); // Index scan
```

### Problema: Transação Quando Atomicidade em Doc Basta

```javascript
// RUIM: Usar transação (lento)
session.startTransaction();
db.progress.updateOne({ userId, lessonId }, ...);
db.users.updateOne({ _id: userId }, ...);
session.commitTransaction();

// BOM: Denormalize em um documento (atômico, rápido)
db.userProgress.updateOne(
  { userId, lessonId },
  { $set: { status: "completed", user: { name, email } }, ...}
);
```

---

## SEÇÃO 7: COMPARAÇÃO SQL vs MongoDB (5 minutos)

| Aspecto | SQL | MongoDB |
|--------|-----|---------|
| Schema | Rígido (schema-on-write) | Flexível (schema-on-read) |
| Transações | ACID, multi-tabela | ACID multi-doc, lentas |
| Joins | Eficientes (normalizados) | Custosos (lookup) |
| Escalabilidade | Vertical (replicação) | Horizontal (sharding) |
| Atomicidade | Linha/transação | Documento |
| Indexação | B-tree | B-tree, text, geospatial |
| Use Case | Estruturado, relações | Flexível, escala, denormalized |

---

## EXERCÍCIO PRÁTICO

Implemente modelo MongoDB para plataforma educacional:

1. **Documento Lesson:** lesson + questions + statistics (denormalized)
2. **Coleção UserProgress:** referência a lesson, não embebimento
3. **Índices:** email (users), userId + status (progress)
4. **Query:** Usuário com progresso em módulo (lookup + agregação)
5. **Atualização:** Marcar resposta correta sem race condition (uso de atomicidade de documento)

---

## RESUMO

MongoDB é NoSQL quando precisa flexibilidade e escala horizontal. Denormalize onde apropriado (dados lidos frequentemente), normalize onde muda frequentemente. Índices são críticos. Transações são caras — prefira atomicidade em documento via embedding + operadores atômicos.
