# LIÇÃO 8.2: Scaling - De Um Servidor a Bilhões de Requisições

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Dilema do Sucesso

Seu sistema funciona. Perfeito. Sua plataforma cresce. Você duplica usuários a cada trimestre. Aí, na Black Friday, requisições aumentam 20x. Seu sistema, que era rápido e confiável, fica lento. Alguns usuários veem timeout.

Isso é sucesso, mas é também o ponto onde engineers que entendimento de escalabilidade se diferenciam de quem não entende.

Scaling não é "adicionar mais servidores". É uma série de decisões, cada uma afetando performance, custo e confiabilidade.

### Objetivo da Lição

Você vai aprender:

- Diferença entre scaling vertical e horizontal
- Quando cada estratégia é apropriada (spoiler: vertical tem limite)
- Load balancing: distribuindo requisições de forma inteligente
- Caching: reduzindo carga no backend
- Database scaling: quando replicação não é suficiente
- Padrões práticos de escalabilidade

---

## SEÇÃO 2: VERTICAL VS HORIZONTAL SCALING (12 minutos)

### Scaling Vertical: Máquina Mais Poderosa

Vertical scaling = pegar seu servidor e fazer ele mais poderoso.

```
Ano 1: 1 servidor, 2 CPU cores, 8GB RAM
Ano 2: 1 servidor, 8 CPU cores, 64GB RAM
Ano 3: 1 servidor, 64 CPU cores, 512GB RAM
```

**Vantagens:**
- Simples: você não muda código
- Sem complicação de distributed: debugging é direto
- Cache local fica quente

**Desvantagens:**
- Limite físico: você não consegue comprar máquina com 1,000 cores por preço razoável
- Single point of failure: um crash derruba tudo
- Downtime para upgrade: você precisa reiniciar o servidor

### Scaling Horizontal: Muitos Servidores Pequenos

Horizontal scaling = adicionar mais máquinas.

```
Ano 1: 1 servidor (2 cores, 8GB)
Ano 2: 10 servidores (2 cores, 8GB cada)
Ano 3: 100 servidores (2 cores, 8GB cada)
```

**Vantagens:**
- Sem limite superior: você adiciona servidores conforme cresce
- Redundância natural: uma máquina cai, as outras continuam
- Upgrade rolling: você atualiza uma máquina por vez

**Desvantagens:**
- Complexidade: você precisa de load balancer, coordenação, etc
- Cache distribuído: cache local não ajuda tanto
- Operacional: mais máquinas = mais para monitorar

### Exemplo Real: Instagram

Instagram começou em 2010 com 1 servidor. Crescimento exponencial forçou escalabilidade:

```
2010: 1 servidor, PostgreSQL monolítico
2011-2012: Atingiu limite vertical, força escalabilidade horizontal

Arquitetura hoje:
- Centenas de servidores web (Python/Django)
- Múltiplas réplicas de database
- Cache distribuído (Memcached, Redis)
- Sharding de dados (dados de usuário A em shard 1, B em shard 2)
- CDN para imagens

Por quê? Volume:
- 2B usuários
- 500M Daily Active Users
- Centenas de milhares de requisições por segundo
- Vertical impossível
```

---

## SEÇÃO 3: LOAD BALANCING - DISTRIBUINDO REQUISIÇÕES (13 minutos)

### Conceito: Router de Requisições

Load balancer é um router:

```
Usuário 1 → Load Balancer → Servidor 1
Usuário 2 → Load Balancer → Servidor 2
Usuário 3 → Load Balancer → Servidor 1
Usuário 4 → Load Balancer → Servidor 3
```

### Estratégias de Distribuição

**1. Round-Robin**

```
Requisição 1 → Servidor 1
Requisição 2 → Servidor 2
Requisição 3 → Servidor 3
Requisição 4 → Servidor 1 (volta ao início)
```

Vantagem: simples. Desvantagem: não lida bem com servidores de capacidades diferentes.

**2. Least Connections**

```
Servidor 1: 100 conexões ativas
Servidor 2: 20 conexões ativas
Servidor 3: 150 conexões ativas

Próxima requisição → Servidor 2 (menos conexões)
```

Vantagem: better balancing. Desvantagem: conexões não são bom proxy para "carga".

**3. Weighted Round-Robin**

```
Servidor 1 (poderoso): 50% das requisições
Servidor 2 (médio): 30% das requisições
Servidor 3 (fraco): 20% das requisições
```

Vantagem: permite diferentes capacidades. Desvantagem: precisa manual tweaking.

**4. IP Hash**

```
IP do usuário → Hash → Sempre mesma requisição vai mesmo servidor
```

Vantagem: session affinity (útil se há cache local). Desvantagem: distribuição desigual se IPs vêm de datacenter específico.

### Health Checks: Removendo Servidores Mortos

```
A cada 5 segundos:
  Load Balancer → Servidor 1: "Você está vivo?"
  Load Balancer → Servidor 2: "Você está vivo?"
  Load Balancer → Servidor 3: "Você está vivo?"

Se Servidor 2 não responde após 3 tentativas:
  Remova Servidor 2 da rotação
  Envie alertas
  
Quando Servidor 2 volta:
  Teste novamente
  Recoloque na rotação
```

### Exemplo Real: Netflix Load Balancing

Netflix recebe ~100k requisições/segundo nos EUA. Como distribui?

```
1. Usuário em Los Angeles faz requisição
2. DNS resolve para nearest CDN (edge server em LA)
3. CDN edge server conversa com load balancer regional
4. Load balancer distribui para um de 1000+ servidores backend
5. Servidor backend retorna resposta via cache

Se qualquer servidor cai:
  - Health check detecta em segundos
  - Load balancer remove automático
  - Requisições redistributas
  - Usuário não vê falha
```

---

## SEÇÃO 4: CACHING - REDUZINDO CARGA NO BACKEND (13 minutos)

### Cache em Camadas

```
Usuário → Browser cache (local)
       → CDN cache (edge)
       → Application cache (Memcached, Redis)
       → Database cache (índices, query cache)
       → Disk (source of truth)
```

Cada camada é mais rápida e mais perto do usuário.

### Padrão 1: Cache-Aside (Lazy Caching)

```
1. Requisição chega: "Dados do usuário 123?"
2. Check cache: "Não tenho"
3. Buscam database: "Aqui está"
4. Coloca em cache
5. Retorna resposta

Próxima requisição mesmos dados: pega de cache (10x mais rápido)
```

**Problema:** Dados desatualizam. Se usuário muda nome, cache ainda tem nome velho por minutos.

### Padrão 2: Write-Through

```
1. Usuário atualiza nome
2. Atualiza database
3. Atualiza cache JUNTO
4. Retorna resposta

Cache sempre está atualizado.
```

**Problema:** Mais lento (duas operações), mais risco de inconsistência se cache update falha.

### Padrão 3: Write-Behind (Write-Back)

```
1. Usuário atualiza nome
2. Escreve em cache IMEDIATAMENTE (rápido)
3. Retorna resposta
4. Depois, em background, atualiza database

Muito rápido, mas risco: se cache server cai antes de persistir, dados se perdem.
```

**Tradeoff:** Velocidade vs segurança.

### Exemplo Real: Google Search

Google precisa servir ~100k requisições/segundo. Usa caching agressivo:

```
1. Usuário digita "machine learning"
2. CDN cache (edge): "Tenho resultado de 1 hora atrás"
3. Se não, backend cache (Memcached): "Tenho resultado em memória"
4. Se não, database: "Aqui está, recalculado"

Resultado: 99% das buscas vêm de cache (milissegundos)
1% força recalcular (segundos)

Por quê funciona? Muitas buscas são repetidas (trending topics)
```

---

## SEÇÃO 5: DATABASE SCALING - QUANDO UM BANCO NÃO BASTA (13 minutos)

### Replicação: Read Replicas

```
          Write → Master Database
                    ↓
                  Replicação
                    ↓
         Read ← Slave Database 1
         Read ← Slave Database 2
         Read ← Slave Database 3
```

**Ideia:** Uma máquina recebe escritas. Múltiplas máquinas servem leituras.

**Ganho:** Leituras escalam. 1 servidor agora é 10.

**Problema:** Lag de replicação. Você escreve dado, lê imediatamente, vê valor velho por milissegundos. Aceitável? Depende.

### Sharding: Dividindo Dados

Replicação não resolve se você tem MUITOS dados. Um banco com 1TB de dados não fica mais rápido se replica para 10 servidores (cada um ainda tem 1TB).

Solução: dividir dados entre múltiplos bancos.

```
Usuários 1-1M     → Shard 1
Usuários 1M-2M    → Shard 2
Usuários 2M-3M    → Shard 3
Usuários 3M+      → Shard 4

Pergunta: "Dados do usuário 500k?"
Cálculo: shard = 500k % 4 = Shard 1
```

**Ganho:** Dados distribuídos. Cada shard é 1/4 do tamanho.

**Problema:** Rebalancear é complexo (dados crescem desigualmente). Queries cross-shard são caros.

### Exemplo Real: Twitter Scaling

Twitter precisa armazenar bilhões de tweets. Estratégia:

```
2010: Monolítico MySQL
2011: Master/Slave replicação (leitura escala)
2012-2014: Sharding por user_id
  - Cada shard é um cluster de máquinas
  - Tweet de usuário X vai sempre para shard de X
  - Queries entre usuários viram complexas

Impacto: de 1 servidor → 1000+ servidores database
```

---

## SEÇÃO 6: SÍNTESE - ESCALAR É UM ESPECTRO (6 minutos)

### Checklist de Decisão

1. **Começa simples:** 1 servidor, 1 database
2. **Detecta gargalo:** Qual componente saturou primeiro?
   - CPU? → Vertical até limite, depois horizontal
   - Memória? → Cache agressivo + replicação
   - Disco I/O? → Índices + sharding
3. **Aplica solução específica:** Não scaling genérico, escalada para o gargalo

### Padrão Típico de Crescimento

```
Fase 1 (1-100k usuários): 1 servidor tudo
Fase 2 (100k-1M): Separar app de database
Fase 3 (1M-10M): Load balancer + múltiplos app servers
Fase 4 (10M+): Database sharding + caching distribuído + CDN
Fase 5 (100M+): Múltiplas regiões geográficas
```

### Números de Referência

- 1 servidor: 1-5k RPS
- 10 servidores: 10-50k RPS
- 100 servidores: 100k-500k RPS
- 1000+ servidores: Netflix-scale

---

## SEÇÃO 7: RESUMO

**Scaling Vertical:** Máquina mais poderosa. Simples, mas com limite.
**Scaling Horizontal:** Mais máquinas. Sem limite, mas complexo.
**Load Balancing:** Distribuir requisições inteligentemente.
**Caching:** Reduzir carga no backend em cada camada.
**Database Scaling:** Replicação para leitura, sharding para dados.

Próximo: Escalabilidade em serviços. Como coordenar múltiplos sistemas independentes escalando?

---

## EXERCÍCIO PRÁTICO: Scalability Assessment

### Contexto

Sua plataforma educacional cresceu. Hoje tem:
- 500k usuários
- 10k DAU pico
- 500 RPS durante pico
- 1 servidor app, 1 servidor database

### Tarefas

1. **Diagnóstico:** Qual vai saturar primeiro durante 3x crescimento (1.5k DAU)?

2. **Caching:** Você identifica que 70% de requisições são "buscar aula" (leitura). Qual padrão de cache? Por quê?

3. **Load Balancing:** Você escala app para 5 servidores. Qual estratégia de distribuição? Por quê?

4. **Database:** Cresce para 10M usuários em 1 ano. Replicação é suficiente? Se não, próximo passo?

### Gabarito Esperado

**1. Diagnóstico:** Database vai saturar primeiro. Leitura de disco é o gargalo (10ms latência). Solução: cache para hits (reduce disk) + replicação para distribuir leitura.

**2. Caching:** Cache-Aside. 70% de requisições são leitura, não variam frequentemente, ttl de 1 hora é aceitável.

**3. Load Balancing:** Least Connections. Todos os app servers têm capacidade similar, distribuir por conexões ativas é razoável.

**4. Database:** Replicação cobre leitura (você tem read slaves). Escrever escala menos bem. 10M usuários é momento de considerar sharding por user_id.

---

