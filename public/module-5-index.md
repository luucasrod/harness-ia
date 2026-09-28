# MÓDULO 5: Caching, Performance & Real-time (20 horas, 5 lições)

Transforme sistemas lerdos em sistemas rápidos. Este módulo ensina as cinco camadas de performance em produção: caching, real-time, async, distribuição global e observabilidade.

## Estrutura do Módulo

### LIÇÃO 5.1: Redis & Caching - Padrões e Estratégias (45 min)
**Conceito:** Caching não é otimização; é decisão arquitetural.

- Quando cachear: frequência de leitura vs. custo de computação
- Padrões: Cache-Aside (lazy), Write-Through (sync), Write-Behind (async)
- Invalidação: TTL vs. event-based vs. soft expiration
- Cache stampede: probabilistic early expiration e locking
- Redis distribuído para escala horizontal
- Implementação real: tutor de IA com cache + quota

**Resultados esperados:**
- Reduz carga de banco em 10-100x
- Latência 200ms → 10ms (20x mais rápido)
- Entender trade-offs: latência vs. consistência

---

### LIÇÃO 5.2: WebSockets - Real-time em Escala (40 min)
**Conceito:** Real-time não é polling; é push bidirecional.

- HTTP vs WebSocket: request-response vs. bidirecional
- Padrões: eventos simples, pub/sub, state sync
- Escala horizontal com Redis como message broker
- Reconexão resiliente com backoff exponencial
- Socket.IO: rooms, broadcast, eventos estruturados
- Sincronização pós-reconexão

**Resultados esperados:**
- Latência 500ms (polling) → 10ms (WebSocket push)
- Múltiplos servidores coordenam via Redis
- Clientes reconectam automaticamente

---

### LIÇÃO 5.3: Message Queues - Async em Escala (45 min)
**Conceito:** Async transforma respostas lentas em UX rápida.

- Padrões: fire-and-forget, at-least-once, exactly-once
- Idempotência: processar 2x = resultado igual a processar 1x
- Dead letter queues para falhas
- Retry policies: exponential backoff
- Bull.js: queue library com Redis backend
- Múltiplas filas com prioridades: crítico vs normal vs background

**Resultados esperados:**
- Usuário tem resposta em 300ms (vs. 3000ms sequencial)
- 10x melhor UX com processamento em background
- Nenhuma mensagem é perdida

---

### LIÇÃO 5.4: CDN & Assets - Distribuição Global (45 min)
**Conceito:** CDN reduz latência distribuindo conteúdo perto dos usuários.

- CDN architecture: edge servers, origins, cache levels
- Cache headers: max-age, public/private, immutable, Vary, ETag
- Versionamento: URL hashing, invalidação, cache busting
- Estratégias por tipo: estático (1 ano) vs. dinâmico (revalidar) vs. video
- Revalidação com ETag (304 Not Modified)
- Monitorar hit rate

**Resultados esperados:**
- Latência 1000ms (intercontinental) → 50ms (CDN edge)
- Download 20s → 5s (4x mais rápido)
- Cache hit rate 90%+

---

### LIÇÃO 5.5: Monitoring - Observabilidade em Produção (45 min)
**Conceito:** Sem monitoring, você descobre de falhas quando usuários reclamam.

- Three Pillars: logs (o que), métricas (tendências), traces (caminho)
- Structured logging: JSON, não strings, searchable
- Métricas: latência (histogram), throughput, taxa de erro
- Distributed tracing: follow requisição entre serviços
- Alerting: dispara por anomalia, não por limiar
- SLOs: promessas mensuráveis, error budgets
- Dashboard Grafana: SLI vs. SLO vs. error budget

**Resultados esperados:**
- Descobre falhas em <10 segundos
- Sabe exatamente o impacto e o motivo
- Cumpre com SLOs (99.9%, 99.99%, etc.)

---

## Integração (Como Tudo Funciona Junto)

```
Usuário submete resposta
  ↓
[5.1] Valida + Persiste (cache)
  ↓ (300ms)
Usuário tem feedback imediatamente
  ↓
[5.3] Enfileira grading assíncrono
  ↓
Worker processa (2000ms em background)
  ↓
[5.1] Invalida cache de progresso
  ↓
[5.2] Notifica via WebSocket (push)
  ↓
[5.5] Logs + métricas + traces registram tudo
  ↓
[5.4] Assets (aula, vídeo) servidos por CDN
```

---

## Contexto da Plataforma Educacional

Todas as 5 lições usam a mesma plataforma educacional como fio condutor:

- **Aluno** completa uma aula
- **API** valida, persiste, retorna (cache evita repetir)
- **WebSocket** notifica responsáveis em tempo real
- **Message Queue** processa grading em background
- **CDN** serve conteúdo (vídeo, imagens) rápido
- **Monitoring** rastreia tudo (logs, métricas, traces)

Resultado: plataforma rápida, escalável, confiável.

---

## Objetivos de Aprendizado

Ao final do módulo, você vai saber:

1. **Quando cachear** — decisão baseada em frequência vs. custo
2. **Padrões de cache** — Cache-Aside, Write-Through, Write-Behind
3. **Real-time escalável** — WebSocket + Redis + reconexão
4. **Async eficiente** — Message queues + idempotência + retries
5. **Distribuição global** — CDN + cache headers + versionamento
6. **Observabilidade** — Logs + métricas + traces + alerting + SLOs

---

## Pré-requisitos

- Módulo 1 (Fundação de Engenharia)
- Entender HTTP, REST APIs
- Familiaridade com Node.js / TypeScript
- Banco de dados relacional (PostgreSQL)

---

## Próximos Passos

Após Módulo 5, você pode estudar:

- **Módulo 6:** DevOps/SRE (CI/CD, Harness, deployment)
- **Módulo 7:** Testes (unitários, integração, E2E)
- **Módulo 8:** Segurança (validação, autenticação, OWASP)

Ou mergulhar mais fundo em qualquer uma das 5 camadas de performance.

---

## Estimativa de Tempo

- 5 lições × 45 minutos = 3h45 de conteúdo
- Exercícios práticos: +5-10 horas
- **Total: 8-15 horas de trabalho intenso**

Padrão recomendado: 1 lição por dia (1-2 horas), semana completa.

---

**Versão:** v0.5.0  
**Última atualização:** 27/09/2026  
**Status:** Completo (5 lições, 5 JSONs, exercícios, práticas)
