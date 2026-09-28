# LIÇÃO 8.3: Microservices - Arquitetura Distribuída com Propósito

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Dilema do Monolito

Você começou com 1 código base. Funcionava. Todos os developers contribuindo no mesmo repositório. Deploy era simples: "git push, CI/CD faz deploy."

Mas conforme cresce, o monolito fica:
- Lento para mudar (uma feature toca em 50 arquivos)
- Arriscado (um bug em autenticação quebra tudo)
- Difícil de escalar (você precisa escalar tudo ou nada)
- Impossível de versionar (múltiplas versões da mesma dependência)

Microservices prometem resolver isso. Mas trouxe seus próprios problemas.

### Objetivo da Lição

Você vai aprender:

- Quando microservices fazem sentido (não é "sempre")
- Como desenhar service boundaries
- Padrões de comunicação (sincronos vs assincronos)
- Falhas distribuídas: como um serviço quebrado não derruba o sistema inteiro
- Trade-offs: complexidade operacional vs benefícios de independência

---

## SEÇÃO 2: MONOLITO VS MICROSERVICES (12 minutos)

### Monolito: Tudo Junto

```
1 código base (Python/Node/Java)
1 database
1 deploy
Deploy todo: git push → CI/CD → 1 nova versão em produção

Arquitetura:
  ┌─────────────────────────────┐
  │  Auth | Learning | Payment  │
  │        Monolito             │
  │  (tudo no mesmo processo)   │
  └─────────────────────────────┘
          ↓
      1 Database
```

**Vantagens:**
- Simples: tudo em um lugar
- Performance: chamadas entre módulos são in-process (rápido)
- Transações: ACID fácil (mesma database)

**Desvantagens:**
- Acoplamento: mudar autenticação pode quebrar pagamento
- Escala: precisa escalar tudo (mesmo se só pagamento é gargalo)
- Deployment: 1 bug quebra tudo

### Microservices: Serviços Independentes

```
Service 1: Auth        (Node.js, PostgreSQL)
Service 2: Learning    (Python, MongoDB)
Service 3: Payment     (Java, MySQL)
Service 4: Notifications (Go, Redis)

Cada um:
- Código independente
- Database independente
- Deploy independente
- Tech stack independente

Comunicação: HTTP, gRPC, message queues
```

**Vantagens:**
- Independência: muda autenticação sem tocar aprendizado
- Escala seletiva: pagas mais payment servers, outros ficam como estão
- Falhas isoladas: payment cai, autenticação continua funcionando

**Desvantagens:**
- Complexidade operacional: debugging é multi-serviço
- Network latency: chamadas entre serviços são lentas (10x+ que in-process)
- Consistência: transações agora são distribuídas (muito mais complexas)
- DevOps overhead: mais máquinas, mais monitoramento

### Exemplo Real: Amazon vs Netflix

**Amazon (2002):** 1 monolito gigante. Jeff Bezos mandou memorando: "Todos os serviços precisam ser desacoplados." Resultado: Amazon Web Services (AWS).

**Netflix (2008+):** Monolito em Java. Crescimento exponencial. Netflix Chaos Engineering = injetar falhas propositalmente. Descobriram: monolito frágil. Migraram para microservices. Hoje: 600+ serviços internos.

Lesson: Microservices não são grátis. Mas em escala, são necessários.

---

## SEÇÃO 3: DESENHANDO SERVICE BOUNDARIES (13 minutos)

### Estratégia 1: Domain-Driven Design

Divida não por layer (auth layer, payment layer) mas por domínio de negócio.

```
❌ ERRADO (por layer):
  Auth Service (cuida de tudo de auth)
  Payment Layer (cuida de tudo de pagamento)
  Problema: payment precisa auth, mas agora é dependência entre serviços

✅ CERTO (por domínio):
  Auth Service (responsável por identidade)
  Enrollment Service (responsável por inscrição, cobrança, cancelamento)
  Notification Service (responsável por avisar alunos)
  
Cada serviço tem seu próprio negócio a resolver.
Auth não precisa saber detalhes de Enrollment.
```

### Estratégia 2: Tech Stack Por Serviço

Não é preciso usar mesma linguagem em todos os serviços:

```
Auth Service: Node.js (rápido, I/O pesado)
Video Processing: Python (libraries de ML)
Payment: Java (escala bem, ecosystem financeiro)
Notifications: Go (alta concorrência, lightweight)

Benefício: melhor ferramenta por trabalho
Desvantagem: mais linguagens para maintain
```

### Estratégia 3: Comunicação: Síncrona vs Assíncrona

**Síncrona:** Serviço A chama Serviço B, espera resposta

```
Usuário faz pedido de inscrição
  ↓
Enrollment Service chama Auth Service: "Verificar usuário 123"
  ↓ (espera)
Auth Service responde: "Verificado"
  ↓
Enrollment Service continua: "Salvar inscrição"
  ↓
Retorna resposta ao usuário

Vantagem: Simples, resposta imediata
Desvantagem: Se Auth está lenta, Enrollment fica lenta (cascata de falhas)
```

**Assíncrona:** Serviço A publica evento, Serviço B consome depois

```
Usuário completa pagamento
  ↓
Payment Service publica evento: "PagamentoRealizado"
  ↓ (não espera)
Retorna: "Sucesso"
  ↓
Notification Service (listening):
  Recebe evento "PagamentoRealizado"
  Envia email: "Seu pagamento foi confirmado"

Vantagem: Desacoplado, rápido, resiliente
Desvantagem: Complexidade (garantia de delivery, ordering)
```

### Exemplo Real: Uber Microservices

Uber tem ~1000 microservices internos. Alguns:

```
Trip Service       (cuida de pedidos de viagem)
Driver Service     (localização, status de drivers)
Surge Pricing      (calcula preço dinâmico)
Payments Service   (processa pagamentos)
Notifications      (SMS, push, email)

Comunicação:
  Trip Service cria viagem
  Publica evento: "TripCreated"
  
  Driver Service (listening):
    "TripCreated" → encontra driver próximo
    Publica: "DriverAssigned"
  
  Notifications (listening):
    "DriverAssigned" → envia SMS ao usuário
  
  Surge Pricing (listening):
    "DriverAssigned" → calcula preço baseado demanda atual
    Atualiza Trip Service com preço

Tudo assincronamente, serviços nunca precisam chamar-se direto.
```

---

## SEÇÃO 4: FALHAS DISTRIBUÍDAS - RESILÊNCIA (13 minutos)

### Problema: Cascata de Falhas

```
Usuário faz requisição
  ↓
API Gateway chama Enrollment Service
  ↓
Enrollment Service chama Auth Service (lento, síncrono)
  ↓
Auth Service está sobrecarregado (5s resposta)
  ↓
Enrollment espera 5s, timeout
  ↓
API Gateway espera Enrollment, timeout
  ↓
Usuário vê erro

Resultado: 1 serviço lento fez TUDO ficar lento
```

### Padrão 1: Timeouts

```
Enrollment Service chama Auth Service:
  auth_response = call_with_timeout(auth_service, 1000ms)
  
Se Auth demora >1s:
  Falha rápido
  Tenta fallback
  Não espera indefinidamente

Benefício: Impede cascata (você sabe quando desistir)
Desvantagem: Precisa fallback (se Auth falha, como aprovar usuário?)
```

### Padrão 2: Circuit Breaker

```
Enrollment Service chama Auth Service:

Estado 1: CLOSED (normal)
  Requisições passam normalmente

Estado 2: OPEN (detectada falha)
  5 requisições falharam em fila
  Circuit abre
  Requisições futuras falham IMEDIATAMENTE (sem chamar Auth)
  Usuário vê erro rápido (não espera 5x timeout)

Estado 3: HALF-OPEN (recuperação)
  Depois de 30s, tenta 1 requisição de teste
  Se sucesso: volta CLOSED
  Se falha: volta OPEN por mais 30s

Benefício: Protege do cascata
Desvantagem: Precisa entender quando rearir circuit
```

### Padrão 3: Retry com Backoff Exponencial

```
Enrollment Service tenta chamar Notification Service:

Tentativa 1: falha, aguarda 1s
Tentativa 2: falha, aguarda 2s
Tentativa 3: falha, aguarda 4s
Tentativa 4: falha, aguarda 8s
Tentativa 5: falha, desiste (max retries = 5)

Benefício: Transiente faz recover (rede cai 2s, retry funciona)
Desvantagem: Pode sobrecarregar (se todos retentam, mais carga)
```

### Netflix Chaos Engineering

Netflix injetar falhas propositalmente:

```
- Desliga serviço aleatório
- Mata conexões de rede
- Corta latência pico (99p)
- Objetivo: descobre sistemas frágeis ANTES de produção

Resultado: Netflix nunca tem cascata de falhas
```

---

## SEÇÃO 5: CONSISTÊNCIA DISTRIBUÍDA (12 minutos)

### Problema: ACID Não Existe Mais

No monolito: 1 transação, ACID garantido.

```
BEGIN;
  UPDATE users SET balance = balance - 100 WHERE id = 1;
  UPDATE users SET balance = balance + 100 WHERE id = 2;
COMMIT;
// ACID: ou ambas ocorrem ou nenhuma

No microservices:
  Enrollment Service: "Descontar $100 do usuário"
  Accounting Service: "Creditar $100 em conta"

Se Enrollment falha depois de descontar:
  Dinheiro sumo do usuário
  Conta está inconsistente
```

### Padrão: Saga Distribuída

Quebre transação em múltiplas operações, com compensações:

```
Operação 1: Enrollment Service descontar $100
  ↓ sucesso
Operação 2: Accounting Service creditar $100
  ↓ FALHA

Compensação (rollback distribuído):
  Voltar Operação 2: (já foi falha, nada fazer)
  Voltar Operação 1: Enrollment Service estorna $100

Resultado: Consistência eventual
  Pode levar segundos/minutos para ficar consistente
  Mas no fim, fica
```

### Exemplo Real: Airbnb Bookings

```
Usuário reserva imóvel:

1. Trip Service: cria reserva (status=PENDING)
2. Inventory Service: marca imóvel como booked
3. Accounting Service: charges cartão
4. Notification Service: envia confirmação

Se paso 3 falha:
  Compensação:
    - Reverter paso 2: marca imóvel como disponível
    - Reverter paso 1: cancela reserva
    - Retorna erro ao usuário: "Cartão foi rejeitado"

Usuário vê error, tenta de novo com outro cartão.
```

---

## SEÇÃO 6: SÍNTESE - QUANDO MICROSERVICES? (6 minutos)

### Checklist de Decisão

**Use Microservices quando:**
- [ ] Múltiplas equipes desenvolvem independentemente
- [ ] Diferentes serviços escalam em padrões diferentes
- [ ] Diferentes tech stacks fazem sentido
- [ ] Falha de 1 serviço não pode derruba tudo

**Não use Microservices se:**
- [ ] Monolito é <10k linhas de código
- [ ] 1-2 pessoas desenvolvem
- [ ] Latência é crítica (network é 10x mais lento)
- [ ] Não tem estrutura operacional (DevOps, observabilidade)

### Realidade Prática

- **Startups:** Monolito. Simplicidade > escalabilidade.
- **PMF alcançado:** Monolito ainda. Agora performance importa.
- **Escala (10M+ usuários):** Microservices necessários.

Netflix, Uber, Amazon não começaram com microservices. Evoluíram.

---

## SEÇÃO 7: RESUMO

**Monolito:** Simples, rápido, frágil.
**Microservices:** Complexo, distribuído, resiliente.
**Boundaries:** Domínio de negócio, não layer.
**Comunicação:** Síncrona simples, assíncrona resiliente.
**Falhas:** Timeouts, circuit breakers, retry, saga distribuída.
**Decisão:** Nem sempre é necessário. Complexidade tem preço.

Próximo: Como garantir que sistema distribuído é consistente? E disponível?

---

## EXERCÍCIO PRÁTICO: Migração Monolito → Microservices

### Contexto

Você tem monolito Python com 50k linhas de código. Módulos:
- Auth (10k linhas)
- Learning (20k linhas)
- Payment (15k linhas)
- Notifications (5k linhas)

### Tarefas

1. **Desenhe service boundaries:** Qual seria sua estratégia de decomposição?

2. **Comunicação:** Payment precisa saber quando Learning completion acontece (para evitar charge após cancelamento). Síncrono ou assíncrono? Por quê?

3. **Resilência:** Notification Service fica lenta. Como você impede que isso afete user experience em outras features?

4. **Consistência:** Usuário completa aula. Sistema precisa (1) marcar aula como completa, (2) atualizar progresso, (3) enviar notificação. Como garante consistência?

### Gabarito Esperado

**1. Service Boundaries:**
```
Auth Service (próprio stack)
Learning Service (Python, MongoDB)
Payment Service (Java, MySQL)
Notification Service (Go, Redis)
```

**2. Comunicação:**
Assincronamente. Learning publica "LessonCompleted", Payment listening. Por quê? Se Learning espera resposta síncrona de Payment e Payment está lento, user vê aula lenta.

**3. Resilência:**
Circuit Breaker em Notification. Se falha, user vê aula concluída (conseguiu o resultado principal), mas notificação envia depois (ou falha silenciosamente).

**4. Consistência:**
Saga: Learning marca completa → Payment atualiza (compensação se falhar) → Notification envia (best-effort, sem rollback).

---

