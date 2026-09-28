# LIÇÃO 8.4: Consistency - CAP Theorem e Modelos Prácticos

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Paradoxo

Você quer sistema que é:
- Consistente (dados sempre corretos)
- Disponível (sempre respondendo)
- Tolerante a partições (funciona mesmo com rede cortada)

Mas não pode ter os três. Escolha dois.

Essa é a essência do CAP Theorem, formulada por Eric Brewer em 2000. Mudar como engineers pensam sobre sistemas distribuídos.

### Objetivo da Lição

Você vai aprender:

- CAP Theorem: o que é, por que importa
- ACID vs BASE: trade-offs de consistency models
- Eventual Consistency: como viver com dados "errados" temporariamente
- Exemplos: Google Spanner (strong consistency), Dynamo (eventual consistency)
- Quando sacrificar qual propriedade

---

## SEÇÃO 2: CAP THEOREM - A ESCOLHA IMPOSSÍVEL (12 minutos)

### Os Três Pilares

**Consistency:** Todos os nós veem mesmos dados. Se você escreve X, qualquer leitura vê X.

**Availability:** Sistema sempre responde. Nunca retorna "indisponível" (mesmo em failure).

**Partition Tolerance:** Sistema funciona mesmo com partição de rede (alguns nós desconectados).

### O Teorema

Em caso de falha de rede:

```
Você PRECISA escolher entre:
- Consistency: sacrifica Availability
- Availability: sacrifica Consistency
```

Partition Tolerance é obrigatório (rede falha).

### Visualização

```
       Consistency
           / \
          /   \
         /     \
    CA  /       \ AP
       /         \
      /__________\
    Partition Tolerance (obrigatório)

CA (Consistency + Availability):
  - Banco monolítico (sem replicação)
  - Se rede quebra, retorna erro (sacrifica Availability)

CP (Consistency + Partition Tolerance):
  - Replicação com quorum
  - Se maioria não consegue sync, retorna erro (sacrifica Availability)
  - Google Spanner, HBase

AP (Availability + Partition Tolerance):
  - Responde sempre, dados podem estar desatualizados
  - Eventual Consistency (converge depois)
  - DynamoDB, Cassandra, Riak
```

### Exemplo Real: Falha de Rede

```
Usuário em São Paulo: "Salvar dado em servidor em SP"
Servidor replica para servidor no Rio (5ms latência)

Cenário 1 (Normal):
  SP recebe: escreve localmente, envia para Rio
  Rio: recebe e confirma
  Usuário vê: sucesso em 10ms

Cenário 2 (Rede cortada entre SP e Rio):
  
  Opção CP (Consistency):
    SP quer escrever, mas não consegue sync com Rio
    SP retorna: erro (sacrifica Availability)
    Dados sempre consistentes, mas usuário viu erro
  
  Opção AP (Availability):
    SP: escreve localmente, retorna sucesso imediatamente
    SP e Rio: desincronizados por horas
    Quando rede volta: sync automático (Eventual Consistency)
    Usuário nunca viu erro, mas viu dados "errados" por horas
```

---

## SEÇÃO 3: ACID VS BASE (13 minutos)

### ACID: Strong Consistency

ACID (Atomicity, Consistency, Isolation, Durability):

```
Transação: Transferir $100 de conta A para B

Atomicity: Ou ambas ocorrem ou nenhuma
  Se falha meio do caminho, rollback tudo
  
Consistency: Invariantes mantidas
  Total de dinheiro no sistema nunca muda
  A + B = constante
  
Isolation: Transações não interferem
  Se A e B transferem simultaneamente, resultado é consistente
  
Durability: Escrito em disco, não perde mesmo com crash

Implementação: LOCK database, wait for replication

Vantagem: Garantias fortes
Desvantagem: Lento (precisa wait + sincronização)
```

### BASE: Eventual Consistency

BASE (Basically Available, Soft State, Eventual consistency):

```
Transação: Transferir $100 de conta A para B

Basically Available:
  Sistema responde sempre (never "unavailable")
  
Soft State:
  Dados podem ser temporariamente inconsistentes
  A pode ter perdido $100 antes de B receber
  
Eventual:
  Depois de X tempo, sistema converge
  A + B = constante (eventualmente)

Implementação: Write anywhere, sync later (async replication)

Vantagem: Rápido (escreve localmente, retorna imediatamente)
Desvantagem: Garantias fracas (dados temporariamente "errados")
```

### Exemplo: Instagram Like

```
Você dá like em foto. 

ACID approach:
  1. Check usuário ainda existe
  2. Lock photo row
  3. Increment like count
  4. Replicate para todos servidores
  5. Unlock
  6. Retorna resposta
  Latência: 100-500ms (ruim UX)

BASE approach:
  1. Increment like count localmente
  2. Retorna "sucesso" imediatamente (2ms)
  3. Async: replicate para servidores backup
  4. Converge (segundos)
  Problema: like count pode estar errado por segundos
  Tradeoff: melhor UX (rápido) vs dados temporariamente inconsistentes
```

### Quando Cada?

```
ACID: Dados críticos
  - Transações financeiras
  - Autenticação
  - Inventory (não quer overbooking)

BASE: Dados não-críticos
  - Social feed likes
  - View counts
  - Recommendations (aproximação ok)
  - Real-time stats
```

---

## SEÇÃO 4: CONSISTENCY MODELS - ESPECTRO (13 minutos)

### Forte Consistency

Sempre vê última escrita (monolítico):

```
Escrita: X = 10
Leitura: retorna 10 (garantido sempre)
```

### Eventual Consistency

Converge, mas pode estar desatualizado:

```
Escrita: X = 10 em servidor A
Leitura de A: retorna 10 (imediatamente)
Leitura de B (replica): pode retornar valor velho (9) por segundos
Depois de sync: B retorna 10
```

### Causal Consistency

Se A observa efeito de B, todos observam B antes de A:

```
Operação 1: User escreve comentário
Operação 2: User gosta do comentário próprio

Garantia: Se você vê o like, você já viu o comentário
```

### Read-After-Write Consistency

Se você escreve, sua leitura imediata vê a escrita:

```
Você: "Mude meu nome para João"
Você (imediatamente): "Qual é meu nome?"
Retorna: "João" (garante ver sua própria escrita)

Outros podem ver "João" depois (eventual)
```

### Monotonic Consistency

Leituras não retrocedem. Ordem é mantida:

```
Leitura 1: contador = 5
Leitura 2: contador = 7
Leitura 3: contador não pode ser 6 (retrocesso não pode)
```

---

## SEÇÃO 5: ESTRATÉGIAS DE SINCRONIZAÇÃO (12 minutos)

### Quorum Reads/Writes

```
3 réplicas. Quorum = 2.

Escrita:
  Escreve em 2 de 3 servidores
  Retorna sucesso
  3º servidor sync depois

Leitura:
  Lê de 2 de 3 servidores
  Retorna valor que apareceu em >= 2
  Garante ver escrita mais recente

Vantagem: Consistency forte com alguns replicas down
Desvantagem: Latência (precisa esperar 2 respostas)
```

### Vector Clocks

```
Problema: Rede particionada, múltiplos writes simultâneos
  Servidor A escreve X = 5
  Servidor B escreve X = 7 (não vê A's write)
  Qual é correto? Ambos?

Solução: Vector Clock
  Cada operação tagged com relógio distribuído
  Permite detectar: operações concorrentes vs dependências

[A:1, B:0] "X = 5" (A fez)
[A:1, B:1] "X = 7" (B viu A's operação)

Se novo write não vê anterior, é conflito.
```

### Conflict Resolution

```
Conflitos acontecem em AP systems. Como resolver?

Estratégia 1: Last-Write-Wins (simples, mas perde dados)
  X = 5 (timestamp 10:00:00)
  X = 7 (timestamp 10:00:01)
  Resultado: X = 7 (ignora 5)
  Problema: que escreve depois "ganha", injusto

Estratégia 2: Merge (complexo, mas preserva)
  X = 5 (set {5})
  X = 7 (set {5, 7})
  Retorna ambos para aplicação decidir
  Amazon DynamoDB: application-level conflict resolution

Estratégia 3: Revert-to-committed (precisa confirmação)
  Não aceita write se não conseguir quorum
  Mais forte consistency, menos availability
```

---

## SEÇÃO 6: SÍNTESE - DESIGN PRÁCTICO (6 minutos)

### Checklist de Decisão

**Escolha Consistency Model baseado em:**
- [ ] Dados são críticos? (sim → ACID/Strong)
- [ ] Latência é crítico? (sim → BASE/Eventually Consistent)
- [ ] Pode perder dados? (não → ACID, sim → BASE)
- [ ] Quantos usuários veem simultaneamente? (muitos → eventual melhor)

### Padrão de Crescimento

```
Fase 1 (startup): Monolito ACID (forte consistency)
Fase 2 (escala): Híbrido (auth ACID, feed eventually consistent)
Fase 3 (planeta-scale): Eventual consistency default, consistency forte onde crítico
```

---

## SEÇÃO 7: RESUMO

**CAP Theorem:** Escolha 2 de 3 (Consistency, Availability, Partition Tolerance).
**ACID:** Forte consistency, lento, para dados críticos.
**BASE:** Eventual consistency, rápido, para dados não-críticos.
**Modelos:** Espectrro de forte para eventual, escolha baseado em tradeoff.

Próximo: Availability. Como garantir sistema funciona mesmo com falhas?

---

## EXERCÍCIO PRÁTICO: Escolher Modelo de Consistency

### Contexto

Você está designado escolher modelo de consistency para 3 features:

1. **Pagamento:** Cobrar aluno quando completa aula
2. **Feed Social:** Mostrar comentários e likes
3. **Inventory:** Aulas disponíveis

### Tarefas

1. **Pagamento:** ACID ou BASE? Justifique.

2. **Feed Social:** eventual consistency ok? Por quê?

3. **Inventory:** Se aluno vê "Aula disponível", mas está booked por outro, problema? Como resolve?

4. **Tradeoff:** Se você escolhe eventual consistency para tudo, qual problema descobre em produção?

### Gabarito Esperado

**1. Pagamento:**
ACID. Cobrar é crítico. Se não consegue sync com backup, retorna erro (sacrifica availability). Pior: cobrar duas vezes do mesmo aluno.

**2. Feed Social:**
BASE. Likes são não-críticos. Se eventual consistency de 5 segundos, ninguém reclama. Like count pode estar desatualizado.

**3. Inventory:**
ACID com quorum. Ler de quorum (2+ servidores) garante ver overbooking. Ou usa quorum writes (escreve em maioria antes de retornar sucesso).

**4. Tradeoff:**
Aplicação precisa entender eventual consistency. Ex: user vê "aula disponível", clica "inscrever", recebe erro (já foi booked). Precisa retry logic, não é erro de aplicação.

---

