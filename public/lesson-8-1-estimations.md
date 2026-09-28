# LIÇÃO 8.1: Estimations - Ferramentas Mentais para Escala

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Desafio Real

Você é chamado em uma reunião com PMs e execs. A pergunta vem: "Quantos usuários simultâneos nossa plataforma aguenta?" Ou: "Quanto espaço de armazenamento precisamos para o próximo trimestre?" Ou: "Se adicionarmos livestream ao app, quanto tráfego isso gera?"

Ninguém tem os dados exatos. Você pode dizer "não sei" ou pode fazer uma **estimativa informada**.

Engineers bem-sucedidos não sabem todas as respostas. Eles sabem como construir uma resposta partindo de princípios. Essa lição é sobre essas ferramentas mentais.

### Por Que Isso Importa

- **Decisões de Design:** Um sistema que aguenta 10k RPS é completamente diferente de um que aguenta 10M RPS. Você precisa saber em que ordem você está.
- **Negocia com Stakeholders:** Quando você diz "precisamos de 50GB de armazenamento" com confiança, a conversa muda de tom.
- **Arquitetura Preventiva:** Saber que a escala é crítica desde o começo muda o que você constrói.
- **Debugging de Produção:** Quando algo quebra, você tem intuição sobre onde procurar.

### Objetivo da Lição

Nesta aula você vai aprender:

- Decomposição de um problema complexo em partes estimáveis.
- Fermi estimation: a arte de chegar a respostas de ordem de magnitude.
- Back-of-the-envelope calculations: rápido, prático, confiável.
- Quando uma estimativa é "boa o suficiente" para tomar decisão.
- Validação: como conferir se sua estimativa estava no mínimo no mesmo planeta.

---

## SEÇÃO 2: DECOMPOSIÇÃO - QUEBRANDO GIGANTES (12 minutos)

### A Estratégia Fundamental

Perguntas impossíveis ficam possíveis quando você as quebra.

**Pergunta:** "Quanto tráfego a plataforma de educação vai ter no próximo ano?"

**Problema:** Você não sabe tudo. Não sabe quantos usuários, quanto tempo por usuário, quantas features vão gerar requisições, quantos bots.

**Abordagem Engineer:**

Quebre em perguntas menores:

1. Quantos usuários ativos mensais (MAU) esperamos?
2. Quantos desses acessam em um dia (DAU)?
3. Quando acessam? Distribuição ao longo do dia?
4. Quantas requisições um usuário gera por minuto de uso?
5. Cada requisição gera requisições internas (database, cache, IA)?

De repente, "quanto tráfego" virou perguntas respondíveis.

### Exemplo Real: YouTube Suporta Quantos Uploads Por Segundo?

**Estimativa Break-down:**

```
Usuários globais: ~2.5 bilhões
Usuários que uploadam conteúdo: ~1% = 25 milhões
Frequência de upload: Média 1 upload por mês por uploader
  = 25M uploadadores / 30 dias = 833k uploadadores por dia
  = 833k / 86,400 segundos = ~9-10 uploads/segundo

Outliers (influencers): 1,000 influencers x 50 uploads/dia = 50k uploads/dia
  = 50k / 86,400 = ~0.6 uploads/segundo

Total: ~10-15 uploads/segundo baseline
Picos (premieres, eventos): 10x = 100-150 uploads/segundo
```

**Validação:** YouTube confirma ~500h de video upload por minuto, que é ~8,300 uploads/segundo. Por quê? Porque estamos com DAU muito maior (1.5B+), e muitos uploads é de bots, entradas de câmera contínua, etc. Nossa estimativa de "10-15" era ordem de magnitude correta para usuários humanos.

### Padrão de Decomposição

1. **Top-down:** Começa do grande (população global) e desce
2. **Bottom-up:** Começa de um usuário e multiplica
3. **Valida no meio:** Você frequentemente descobre que suas suposições estão erradas

**Dica:** Sempre comunique suas suposições. "Assumindo 2M usuários, 30% engajados, 5 requisições por sessão..."

---

## SEÇÃO 3: FERMI ESTIMATION - ARTE E CIÊNCIA (13 minutos)

### O Que É Fermi Estimation

Enrico Fermi era físico nuclear. Em 1945, observou o teste da primeira bomba atômica e estimou sua potência em 10 quilotons observando fragmentos de papel caindo. Ele acertou em uma ordem de magnitude.

Fermi Estimation é: **Chegar a uma resposta razoável usando lógica e aproximação, mesmo com dados incompletos.**

### Técnica: Encadeamento de Estimativas

Você não estima uma número. Você estima vários pequenos, depois os multiplica.

**Pergunta:** Quanto espaço em disco o Netflix gasta armazenando todos os filmes?

**Decomposição:**

```
Títulos no catálogo Netflix: ~6,000
Qualidades por filme:
  - 4K: 1 arquivo
  - 1080p: 1 arquivo
  - 720p: 1 arquivo
  - 480p: 1 arquivo
  - 240p: 1 arquivo
  = 5 qualidades por filme

Tamanho médio por qualidade:
  - 4K, 2 horas: ~100GB (alta taxa de bits)
  - 1080p, 2 horas: ~10GB
  - 720p, 2 horas: ~3GB
  - 480p, 2 horas: ~1GB
  - 240p, 2 horas: ~0.5GB

Total por filme: ~114GB
Total para 6,000 filmes: 6,000 × 114GB = 684TB

Mas Netflix também tem séries (mais episódios):
  Estimados em 2,000 séries
  Média 20 episódios por série
  Média 45 min por episódio
  = 2,000 × 20 = 40,000 episódios
  = 40k × (114GB / 2) = ~2.3PB

TOTAL: 684TB (filmes) + 2,300TB (séries) = ~3PB
```

**Realidade:** Netflix não divulga números exatos, mas rumores sugerem 15-30PB. Por quê?

- Múltiplas cópias (redundância)
- Diferentes versões (idiomas, legendas, áudio)
- Arquivos temporários durante transcodificação
- Backup e recuperação

Nossa estimativa de **3PB só de conteúdo principal** estava no caminho certo.

### Técnica: Fermi's Insight

Fermi frequentemente dizia: "Não preciso do número exato; preciso saber se é 10, 1,000 ou 1 milhão."

**Ordem de Magnitude é a resposta.**

Se você está estimando requisições e chega a 1,000 RPS vs 10,000 RPS, a arquitetura muda completamente. A diferença entre "cabe em uma máquina" vs "precisa de distribuição" é enorme.

---

## SEÇÃO 4: BACK-OF-THE-ENVELOPE - RÁPIDO E PRÁTICO (14 minutos)

### Quando Você Precisa de Back-of-the-Envelope

Você está em uma conversa, alguém faz uma pergunta. Você tem 2 minutos. Não pode correr para o spreadsheet. Você precisa de uma resposta que seja razoável.

### Técnica: Números Redondos e Divisão Fácil

Não se preocupe com precisão. Use números que simplificam cálculo.

**Exemplo 1: Bandwidth para Livestream**

```
Pergunta: "Se 1 milhão de pessoas assistirem livestream simultaneamente, 
quanto de bandwidth precisamos?"

Decomposição rápida:
- Bitrate 1080p @ 60fps: 5 Mbps (é um número real, redondo)
- 1M usuários × 5 Mbps = 5M Mbps = 5 Pbps (petabits por segundo)

Converso para termos business:
- 5 Pbps = 5,000 Tbps
- Datacenter típico: 1 Tbps de saída
- Logo: você precisa de 5,000 datacenters em paralelo, OU
- Distribui via CDN (Akamai, Cloudflare) que tem 5,000+ pontos de presença globais

Conclusão: Possível, mas massivamente distribuído. Netflix/YouTube fazem isso.
```

**Exemplo 2: Armazenamento de Conversas (Chatbot)**

```
Pergunta: "Quanto espaço uma conversa média gasta?"

Decomposição:
- Conversa típica: 50 mensagens bidirecional = 100 mensagens
- Tamanho médio: 200 caracteres/mensagem (varia)
- 100 × 200 = 20,000 caracteres = ~20KB texto puro
- Com metadados (timestamp, user_id, model_used): ~30KB por conversa
- 1M conversas = 1M × 30KB = 30TB

Banco de dados overhead (indexação, replicação):
- 30TB × 3-4x = 90-120TB

Logo: 100TB de armazenamento para 1M conversas. Cabe em hardware moderno.
```

### Validação Rápida: Regra do Polegar

Depois que você estimou, sempre faça uma conferência:

- É razoável? (10 horas de engineer, não 10 anos)
- Faz sentido de negócio? (Se você está estimando 1M RPS em um sistema que hoje tem 1k, algo deu errado)
- Validável? (Você pode medir isso após implementar?)

---

## SEÇÃO 5: NÚMEROS QUE TODO ENGINEER PRECISA SABER (15 minutos)

### Latência: A Linguagem da Escala

Jeff Dean (Google) compilou números que se tornaram referência:

```
Operação                                  Tempo
L1 cache reference                        0.5 ns
L2 cache reference                        7 ns
Main memory reference                     100 ns
Disk seek                                 10,000,000 ns (10ms)
Network roundtrip datacenter              500,000 ns (0.5ms)
```

**Insight:** Memória é 100x mais rápida que disco. Disco é 100x mais rápido que rede. Rede é 10x mais rápida que busca de disco.

Isso explica por que engineers obsessão com:
- Caching (reduzir leitura de disco)
- Batching (reduzir chamadas de rede)
- Índices (evitar varredura de disco)

### Armazenamento: Números de Referência

```
1 byte         = 1 caractere
1 KB           = 1,000 bytes (um parágrafo curto)
1 MB           = 1,000,000 bytes (uma música MP3)
1 GB           = 1 bilhão bytes (filme em HD)
1 TB           = 1 trilhão bytes (1,000 filmes HD)
1 PB           = 1 quadrilhão bytes (todo YouTube ~2PB/dia)
```

### Throughput: Números Realistas

```
Disco mecânico (HD): ~100 MB/s leitura sequencial
Disco SSD NVMe: ~3,000 MB/s
Rede Gigabit: ~125 MB/s (1 Gbps / 8)
Rede 10 Gigabit: ~1,250 MB/s
```

### Taxa de Falha: Números de Confiabilidade

```
99% uptime        = 3.7 dias/ano offline ("two nines")
99.9% uptime      = 8.7 horas/ano offline ("three nines")
99.99% uptime     = 52 minutos/ano offline ("four nines")
99.999% uptime    = 5.2 minutos/ano offline ("five nines")
99.9999% uptime   = 31 segundos/ano offline ("six nines")
```

Netflix busca "five nines" (99.999%), o que significa ~5 minutos por ano inteiro de falha planejada + não planejada.

---

## SEÇÃO 6: SÍNESE - JUNTANDO TUDO (5 minutos)

### Checklist de Estimativa Bem-Feita

1. **Comunique suposições:** "Assumindo X, Y, Z..."
2. **Quebre em partes:** Nunca tente estimar tudo de uma vez
3. **Use números redondos:** 2M é suficiente, não precisa 2,147,483 exatamente
4. **Valide no meio:** Sua suposição sobre MAU mudou? Recalcula tudo
5. **Expresse em ordem de magnitude:** "10-100 MB/s", não "47.3 MB/s"
6. **Documente:** Próximo engineer que ler esse design precisa entender como você chegou nos números

### Quando Sua Estimativa Vai Estar Errada

- Quando há fatores não técnicos (viral content, mudança de requisito)
- Quando sistemas se comportam de formas não lineares
- Quando você esqueceu de um caso de uso importante

E está tudo bem! Uma estimativa que te colocou no caminho certo é sucesso.

---

## SEÇÃO 7: RESUMO

**Estimação em Escala:**
- Não é adivinhação; é lógica estruturada
- Decomposição é sua aliada: quebra gigantes em perguntas respondíveis
- Fermi estimation: ordem de magnitude é suficiente
- Back-of-the-envelope: rápido, prático, confiável
- Números de referência: latência, armazenamento, throughput, confiabilidade

Próxima aula: como esse design não é estático. Ele precisa **escalar** quando realidade não colabora.

---

## EXERCÍCIO PRÁTICO: Estimativa de Plataforma Educacional

### Contexto

Você está designado para estimar requisitos de sistema para uma plataforma educacional com 500k usuários esperados no primeiro ano.

### Dados Conhecidos

- 500k usuários ao longo do ano
- Pico: Janeiro-Março (volta às aulas) = 70% de picos
- Queda: Junho-Agosto = 20% de picos
- Uso: 10% são super-users (estudantes regulares), 20% são casuais

### Tarefas

1. **Estimativa de DAU (Daily Active Users):** Considerando distribuição semanal e ciclo anual, quantos usuários você espera por dia durante o pico?

2. **Requisições por Segundo:** Um usuário faz:
   - 1 login por dia (~1 req)
   - Assiste aulas (~100 reqs durante sessão, média 30 min)
   - Faz exercícios (~50 reqs por série de exercícios)
   - Usa tutor de IA (~20 reqs por conversa, média 3 conversas)
   
   Qual é o RPS estimado durante pico de pico (18h de 1 hora)?

3. **Armazenamento:** 
   - 50 aulas por módulo, 8 módulos
   - Cada aula tem vídeo (~2h em 1080p, ~10GB) + materiais (~100MB)
   - Qual é o espaço para conteúdo de curso?
   - Agora multiplica por 3x redundância

4. **Validação:** Sua estimativa "faz sentido" em terms de:
   - Um servidor único (1TB, 100 Mbps) aguentaria? Explica por quê.
   - Dois servidores com load balancing? Por quê?

### Gabarito Esperado

**1. DAU:**
```
MAU pico = 500k × 70% = 350k usuários
DAU pico = MAU × 20% (~20-30% é taxa típica) = 70-100k
Estimativa: 80k DAU
```

**2. RPS:**
```
80k DAU
10% super-users = 8k usuarios, 20% casuais = 16k
Média requests por usuário: (1 + 100 + 50 + 20) = 171 requests
Distribuído em ~4 horas de pico? = 171 reqs / 14.4k segundos = 0.012 req/segundo/user

8k × 0.012 = 96 RPS super-users
16k × 0.004 = 64 RPS casual-users
Total: ~150-200 RPS durante pico

Isso é administrável em um servidor bem configurado (1 servidor aguenta 1000+ RPS)
```

**3. Armazenamento:**
```
400 aulas (50 × 8)
Cada: 10GB vídeo + 100MB = ~10.1GB
Total conteúdo: 400 × 10.1GB = ~4TB
Com 3x redundância: 12TB
Adiciona backups (2x): 24TB
```

**4. Validação:**
```
Um servidor 1TB não aguenta 24TB conteúdo.
Logo: precisa de storage distribuído (S3, Google Cloud Storage, etc)
Servidores web (stateless) podem ser múltiplos.
Load balancer distribui os 200 RPS entre eles.

Arquitetura mínima:
- 1-2 servidores web (stateless)
- 1 database (PostgreSQL, pode ser gerenciada)
- 1 cache (Redis)
- Object storage S3 (escalável)
```

---

## NOTAS IMPORTANTES

- **Não existe "estimativa perfeita":** Existe estimativa "boa o suficiente para tomar decisão"
- **Revise frequentemente:** Quando realidade não bate, você aprendeu algo
- **Comunique incerteza:** "10-100 TB com 80% confiança" é melhor que "42 TB com certeza"
- **Engineers bons estimam; engineers ótimos revisam suas estimativas quando erram**

---

