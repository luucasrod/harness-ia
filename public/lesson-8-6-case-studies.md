# LIÇÃO 8.6: Case Studies - Google Spanner, Netflix, LinkedIn em Escala

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### Por Que Case Studies?

Você aprendeu conceitos: scaling, consistency, availability. Mas como ficam na realidade?

Case studies mostram:
- Decisões reais (não hipotéticas)
- Tradeoffs que fizeram (por quê sacrificaram X?)
- Problemas que não imaginaram
- Como evoluíram de monolito para escala

### Objetivo da Lição

Você vai explorar 3 empresas que resolveram "sistema distribuído em escala":

1. **Google Spanner:** Consistency forte + distribuído global
2. **Netflix:** Eventual consistency + chaos engineering
3. **LinkedIn:** Real-time analytics em terabytes

Cada uma escolheu caminho diferente. Nenhuma é "certa", todas são apropriadas para contexto.

---

## SEÇÃO 2: GOOGLE SPANNER - CONSISTENCY EM ESCALA GLOBAL (14 minutos)

### O Problema

Google precisa:
- Escalar globalmente (múltiplas regiões)
- Mas manter ACID (consistência forte)
- Sem sacrificar performance

ACID em escala global é "impossível" (viola CAP theorem). Google descobriu: não é, se você tem tempo (latência).

### A Solução: Spanner

```
Ideia central: Use GPS + atomic clocks pra coordenar tempo real
```

#### TrueTime API

Google coloca atomic clocks (relógios atômicos) em cada datacenter. Todos sincronizados com GPS.

```
Traditional database:
  "Qual é a hora?" → Sistema operacional
  Problema: relógio pode estar desincronizado entre máquinas

Google Spanner:
  "Qual é a hora?" → TrueTime (atomic clock)
  Resultado: hora é sempre coordenada globalmente
  Margem de erro: < 10 ms (vs 500ms typical)
```

#### Timestamp Ordering

Usando TrueTime, Spanner:

1. **Escrita:** Assign timestamp de quando escrita ocorreu (globalmente consistente)
2. **Leitura:** Lê dados com timestamp <= read_timestamp
3. **Garantia:** Se A vê efeito de B, timestamp de B < timestamp de A

Resultado: Consistency distribuída globalmente.

#### Replicação

```
Escrita em US:
  Escreve em quorum de replicas US
  Replica para EU, Asia (async, mas com timestamp)

Leitura em EU:
  Lê de replica EU com timestamp > read_timestamp
  Garante ver última escrita

Falha de replica:
  Quorum ainda tem maioria
  Escreve ainda conseguem sucesso
```

#### Performance Tradeoff

TrueTime sincronização é pesada (latência). Mas Spanner aguenta:

```
Inter-datacenter latency: 100+ ms (normal)
Spanner adds 10ms (TrueTime sync)
Total: 110-150 ms por transação

Comparação:
  NoSQL (eventual): 10ms
  Spanner (strong): 110ms
  Trade: 10x latência por garantia ACID global
```

### Quando Google Usa Spanner

- Transações financeiras (precisa ACID)
- Dados críticos que precisam replicar globalmente
- Aplicações que podem esperar 100+ ms

### Quando Não Usa

- Real-time (video serving, search ranking)
- Dados de sessão (cache é melhor)
- Analytics em volume enorme

---

## SEÇÃO 3: NETFLIX - EVENTUAL CONSISTENCY + CHAOS (14 minutos)

### O Problema

Netflix precisa:
- Servir 500k RPS globalmente
- Nunca dar timeout (usuario quer assistir NOW)
- Sobreviver falhas de datacenter
- Mudar código sem parar serviço

Netflix não pode esperar latência de Spanner. Precisa <100ms sempre.

### A Solução: Microservices + Chaos

#### Arquitetura Distribuída

```
Serviços independentes:
  - API Gateway (rota requisições)
  - Video Service (metadata, títulos)
  - Playback Service (streaming real)
  - Recommendation Service (ML, sugestões)
  - User Service (profile)
  - Accounting Service (subscription)

Cada um:
  - Independente, escalável
  - Replica em múltiplas regiões (active-active)
  - Eventual consistency (não ACID)
  - Fallback para cache se downstream lento
```

#### Chaos Engineering

Netflix sistematicamente quebra seus sistemas pra testar resiliência:

```
Simian Army (tools de caos):

1. Chaos Monkey
  - Mata servidores aleatoriamente
  - Objetivo: descobrir serviços frágeis
  - Rodando: continuamente (2x/dia)

2. Chaos Gorilla
  - Simula queda de datacenter inteiro
  - Objetivo: testar failover multi-region
  - Frequência: montly

3. Latency Monkey
  - Adiciona latência artificial entre serviços
  - Objetivo: descobrir timeout cascata
  - Frequência: continuously

Resultado: Netflix fica resiliente PORQUE testa quebras continuamente
Mentalidade: "Se não testou, não funciona"
```

#### Fallback Culture

```
Qualquer serviço downstream pode falhar. Netflix nunca falha.

User clicks "Play"
  → Playback Service chama Video Service: "Metadata do vídeo 123"
  
  Video Service:
    [ Try ] Query database
      Success? Return data
      Timeout? → [ Fallback 1 ] Try cache
        Cache hit? Return stale (1 hora velha OK)
        Cache miss? → [ Fallback 2 ] Return empty metadata
          Playback Service: "Vou reproduzir sem metadata"
          User vê: vídeo sem descrição (ruim UX, melhor que erro)

Resultado: User nunca vê erro. Features degrade gracefully.
```

#### Global CDN

Netflix não serve vídeos de datacenter (latência ruim). Usa CDN:

```
Netflix coloca caches em ISP datacenters:
  - Comcast datacenter
  - Verizon datacenter
  - AT&T datacenter
  - Etc (200+ caches globais)

User clicks play:
  DNS resolve para nearest cache
  Vídeo vem de cache (não Netflix backbone)
  Resultado: 2-5 ms latência (local)

Se cache falha:
  Fallback para Netflix regional (100-200ms)
  Se regional falha:
  Fallback para master (500ms, raro)
```

### Netflix Strategy Summary

- Eventual consistency ok (feed pode estar 5s desatualizado)
- Never fail: fallback, degrade, cache everything
- Test falhas: chaos engineering
- Global redundancy: active-active em 3 regiões
- CDN: push content perto de users

---

## SEÇÃO 4: LINKEDIN - REAL-TIME ANALYTICS IN TERABYTES (14 minutos)

### O Problema

LinkedIn precisa:
- Processar bilhões de eventos (cliques, posts, searches)
- Gerar insights em real-time (trending, recommendations)
- Escalar de 100k a 1B eventos/dia

Solução tradicional (database) não funciona (speed, volume).

### Arquitetura: Lambda

```
Camada real-time (speed):
  Eventos → Kafka → Storm (stream processing)
  Resultado: trending topics em 5 minutos
  Usado pra: feed ranking, recommendations

Camada batch (volume):
  Eventos → HDFS → Hadoop (batch processing)
  Resultado: análise completa em 12-24h
  Usado pra: business intelligence, analytics
```

#### Real-time Streaming (Storm)

```
Event: User likes post
  ↓ Kafka (message queue)
  ↓ Storm workers (distributed processing)
    [ Filter ] Apenas posts públicos
    [ Enrich ] Add user profile data
    [ Aggregate ] Increment like count (HyperLogLog sketch, não exact)
    [ Output ] Update Redis cache
  ↓ Web tier reads cache
    Feed shows: "123 likes" (updated real-time)

Latency: 5-10 seconds
Accuracy: 99% (sketch, not exact)
Volume: 100k events/second sustained

Tradeoff: latency + speed over exactness (123 vs 124 likes, ok)
```

#### Batch Processing (Hadoop)

```
Day 1 (real-time):
  "123 likes" (from Storm cache)
  User sees: trending

Day 2 (batch):
  Hadoop processed all events
  True count: "126 likes"
  Database updated
  Discrepancy: 3 likes difference
```

#### Storage: Database + Cache + HDFS

```
Hot data (user profile):
  Database (MySQL with replicas)
  Cache (Redis, 10GB)
  RTO: 60s (failover)
  Consistency: strong

Warm data (user feed, recommendations):
  Cache (Memcached, 100GB)
  Database (Cassandra, eventually consistent)
  TTL: 1h
  Consistency: eventual

Cold data (historical analytics):
  HDFS (Hadoop distributed filesystem)
  S3-equivalent
  Latency: not critical (batch)
```

### LinkedIn Strategy Summary

- Separate real-time (fast, approximate) from batch (slow, exact)
- Use cache heavily (avoid database hits)
- Event streaming (Kafka/Storm) for live data
- Batch processing (Hadoop) for volume
- Accept eventual consistency where latency > accuracy

---

## SEÇÃO 5: COMPARAÇÃO - TRÊS CAMINHOS (12 minutos)

### Trade-offs Lado a Lado

```
                  SPANNER       NETFLIX        LINKEDIN
Consistency       ACID/Strong   Eventual       Hybrid (realtime+batch)
Latency Target    100-200ms     <50ms          5min (streaming), 24h (batch)
Global?           Yes (multi-r) Yes (active-a) Yes (via CDN+replication)
Failure Handling  Quorum        Fallback       Separate streams
Database          Relational    Cassandra+     MySQL+Cassandra+HDFS
CAP Choice        CP            AP             AP (realtime), consistency-eventual

Who Should Do:
Spanner:          Banks, inventory, transactional
Netflix:          Media, social, user experience critical
LinkedIn:         Analytics, big data, real-time insights
```

### Real-world Inspirations

- **Spanner:** Your system has global transactions (rare)
- **Netflix:** Your system must never fail (common)
- **LinkedIn:** Your system processes huge data volume (common)

Most startups: start Netflix (simple, resilient), evolve based on needs.

---

## SEÇÃO 6: SÍNTESE - QUAL CAMINHO? (5 minutos)

### Decision Tree

```
Pergunta 1: Precisam ACID global?
  YES → Spanner model (tradeoff latência por consistency)
  NO → Netflix/LinkedIn model

Pergunta 2: Latência é crítico (<50ms)?
  YES → Netflix model (fallback, cache, eventual)
  NO → LinkedIn model (separate realtime/batch)

Pergunta 3: Volume é enorme (>1M QPS)?
  YES → LinkedIn + Netflix (streaming + batch)
  NO → Simpler architecture (Netflix sufficient)
```

### Padrão de Evolução

```
Fase 1: Monolito
  - 1 database
  - Simple, slow

Fase 2: Microservices + Cache
  - Separate services
  - Heavy caching (Netflix-style)
  - Eventual consistency

Fase 3: Streaming + Batch
  - Real-time stream processing (Storm/Kafka)
  - Batch analytics (Hadoop)
  - Hybrid approach

Fase 4: Global Transactions
  - Multi-region consistency (Spanner/CockroachDB)
  - If transactional requirements emerge
```

---

## SEÇÃO 7: RESUMO

**Google Spanner:** Sacrifica latência (100ms) pra ganhar consistency global (ACID).
**Netflix:** Sacrifica consistency (eventual) pra ganhar latência (<50ms) e resilience.
**LinkedIn:** Sacrifica real-time exactness (streaming approximate) pra ganhar volume (terabytes).

Não existe "melhor". Depende do seu sistema e valores (consistency vs performance vs volume).

Next: Você agora entende System Design & Scalability. Próximo passo: implementar.

---

## EXERCÍCIO FINAL: Arquitetar Para Seu Caso

### Cenário Escolha Seu

A) **Marketplace (Uber-style):** 
   - Real-time: driver location, user matches
   - Transacional: payment deve ser consistente
   - Volume: 1M+ events/minute
   - Qual estratégia: Netflix + Spanner hybrid?

B) **SaaS Analytics (Mixpanel-style):**
   - Real-time: dashboard updates
   - Batch: historical reports
   - Volume: 10B events/day
   - Qual estratégia: LinkedIn streaming + batch?

C) **Social Media (Instagram-style):**
   - Real-time: feed, likes, comments
   - Non-transactional (eventual ok)
   - Volume: 100k+ events/second
   - Qual estratégia: Netflix + Redis?

### Tarefas

1. **Escolha seu cenário**

2. **Desenhe arquitetura:** Services, databases, cache, streaming?

3. **Escolhas de consistency:** ACID onde? Eventual onde?

4. **Disaster recovery:** Qual é SLA? Como falha?

5. **Scaling:** Como atinge 10x volume?

### Gabarito Esperado

Documento com:
- Diagrama de arquitetura
- Serviços + responsabilidades
- Consistency model por dados
- RTO/RPO targets
- Scaling strategy
- Disaster recovery plan
- Referências ao caso studies (Spanner/Netflix/LinkedIn)

---

## RESSURSOS

**Google Spanner Papers:**
- "Spanner: Google's Globally-Distributed Database"
- Leia sobre TrueTime, replicação

**Netflix Blog:**
- "Chaos Monkey" releases
- "A Look Inside Netflixs Technology" (yearly)

**LinkedIn Engineering:**
- "Building Real-time Data Pipeline at Linkedin"
- "Kafka: A Distributed Messaging System"

---

