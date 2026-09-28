# LIÇÃO 8.5: Availability - De 99% a 99.999%

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### A Linguagem do Uptime

99% uptime = 3.7 dias por ano offline. Aceitável para startup.
99.99% uptime = 52 minutos por ano offline. Esperado de serviço pago.
99.999% uptime = 5.2 minutos por ano offline. Netflix, AWS target.

Cada 9 adicional custa exponencialmente mais.

### Objetivo da Lição

Você vai aprender:

- Medindo uptime: o que contar como "down"?
- Redundância: múltiplas cópias, múltiplas regiões
- Failover: detectar falha, switch automático
- Health checks: sabendo quando tudo está errado
- Disaster recovery: backup estratégico para pior caso
- Trade-offs de custo vs confiabilidade

---

## SEÇÃO 2: MEDINDO UPTIME (12 minutos)

### O Que Contar Como "Down"?

```
Opção 1: Sistema responde
  API retorna 200 OK
  Contou como "up"
  Problema: pode estar degraded (50% latência, erros intermitentes)

Opção 2: Sistema funciona corretamente
  Response < 100ms AND success rate > 99.5%
  Contou como "up"
  Mais realista

Opção 3: Usuário consegue completar ação
  Usuário consegue fazer inscrição completa
  Contou como "up"
  Melhor, mas complexo de medir
```

### Calculando Nines

```
Uptime% = (Total Time - Downtime) / Total Time × 100

Ano = 365 dias = 525,600 minutos

99% uptime: 99% × 525,600 = 520,044 minutos up
Downtime: 525,600 - 520,044 = 5,556 minutos = 3.9 dias

99.9% uptime: 525,600 × 0.999 = 525,074.4 minutos up
Downtime: 525.6 minutos = 8.76 horas

99.99% uptime: 525,600 × 0.9999 = 525,495.24 minutos up
Downtime: 104.76 minutos = 1.7 horas

99.999% uptime: 525,600 × 0.99999 = 525,594.24 minutos up
Downtime: 5.76 minutos

Custo para chegar lá? Exponencial.
```

### Exemplo: Google SLAs

```
Google Compute Engine: 99.95% SLA
  = ~26 minutos downtime por ano
  Se falhar, Google paga créditos ao cliente

Gmail: 99.9% SLA
  Mas realidade: ~99.98% (marketing conservador)
```

---

## SEÇÃO 3: REDUNDÂNCIA - MÚLTIPLAS CÓPIAS (13 minutos)

### Replicação Geográfica

```
Single Datacenter (DC):
  US East datacenter crashes
  Tudo cai
  Uptime: 99%

Multi-Datacenter (Region):
  US East crashes
  US West continua
  Uptime: 99.9%

Multi-Region (Global):
  US crashes
  Europe continua
  Uptime: 99.99%
```

### Estratégia 1: Active-Passive

```
Active (US East): recebe tráfego, escreve dados
  ↓ replicação
Passive (US West): standby, pronto para assumir

Se Active cai:
  Passive detecta
  Muda DNS: tráfego → Passive
  Passive vira Active
  Tempo de failover: 1-5 minutos

Desvantagem: tráfego em Passive é "desperdiçado" (não usa capacidade)
```

### Estratégia 2: Active-Active

```
Active DC 1 (US East): recebe tráfego, escreve
Active DC 2 (US West): recebe tráfego, escreve

Ambos processam requisições
Ambos replicam dados

Se DC1 cai:
  Tráfego já está em DC2 (via load balancer)
  DC2 continua normalmente

Vantagem: tráfego sempre usado (máxima eficiência)
Desvantagem: consistência distribuída é complexa (múltiplos writes)
```

### Exemplo: Netflix (Active-Active)

```
Netflix distribui tráfego entre 3 regiões AWS
  US-East
  US-West
  Europe

Cada região é ativa:
  - Recebe requisições
  - Escreve dados
  - Serve usuários

Se US-East cai:
  Suas requisições automáticamente vão para US-West/Europe
  Usuários não veem queda

Custo: 3x infraestrutura, mas confiabilidade é máxima
```

---

## SEÇÃO 4: FAILOVER - DETECTAR E SWITCH (13 minutos)

### Health Checks: Sabendo Quando Está Errado

```
A cada 5 segundos, sistema checa:

API Server 1: "Você está vivo?"
  Timeout > 2s? → Falha
  Return 500? → Falha
  Response 200? → OK

Database: "Consegue responder query?"
  SELECT 1 timeout? → Falha
  Replication lag > 10s? → Degraded

Load Balancer: "Qual servidor remover?"
  Após 3 health check falhas consecutivas: Remove de rotação
  Após 30s de sucesso: Recoloque em rotação
```

### Failover Automático

```
Cenário: Primary database crashes

Detectado: Health check falha 3x (15s total)
Ação: Promove replica como nova primary
  Replica = Master agora
  Outros replicas → replicam de novo Master

Tempo de failover: 20-60 segundos (application resilience crucial)

Qual dado se perde?
  Writes após crash até promote = perdido (ou in-flight)
  Por isso replication lag importa
```

### Exemplo: Amazon RDS Failover

```
RDS com replicação multi-AZ:
  Primary em US-East-1a
  Replica em US-East-1b

Primary falha:
  RDS detecta via health check
  Promove replica automaticamente
  Nova DNS responde: 1b
  Aplicação continua (transparente)
  Tempo: ~60 segundos

Custo: 2x database (replica overhead)
Benefício: 99.95% uptime SLA (6 nines)
```

---

## SEÇÃO 5: DISASTER RECOVERY - PIOR CASO (12 minutos)

### Cenários Pior Caso

```
Caso 1: Datacenter queima
  Failover não ajuda (backup também estava lá)
  Solução: geo-redundant backup (dados em múltiplas regiões)

Caso 2: Ransomware cifra database
  Backups recentes também estão cifrados
  Solução: air-gapped backup (backup offline, inacessível de rede)

Caso 3: Developer deleta dados críticos
  Backups existem, mas demora dias para restaurar
  Solução: point-in-time recovery (backup contínuo, recupera qualquer ponto no tempo)

Caso 4: Aplicação tem bug, escreve dados errados em 100,000 usuários
  Consegue reverter tudo? Demora?
  Solução: transaction log, rollback se necessário
```

### Estratégia: Backup 3-2-1

```
Regra: 3 cópias, 2 mídias diferentes, 1 offsite

Exemplo:
  1 cópia: Production database
  2 cópia: Hot replica (pronto para failover)
  3 cópia: Cold backup (armazenamento de longo prazo, S3)

Mídias diferentes:
  Database ✓
  Block storage (EBS) ✓
  Object storage (S3) ✓

Offsite:
  S3 em região diferente ✓
```

### RTO vs RPO

```
RTO (Recovery Time Objective): quanto tempo para recuperar?
  Active-active: ~0 minutos (imediato)
  Active-passive com failover automático: ~1 minuto
  Failover manual: ~30 minutos
  Restaurar de backup: ~2-24 horas

RPO (Recovery Point Objective): quanto de dados pode perder?
  Replicação síncrona: 0 dados (zero loss)
  Replicação assíncrona: ~5 segundos de dados
  Daily backup: ~24 horas de dados

Tradeoff: replicação síncrona é lenta, assíncrona é rápida mas perde dados
Netflix: síncrona dentro região (rápido), assíncrona entre regiões
```

### Exemplo: Google Cloud's 11-nines Promise

```
Google testa disaster recovery rigorosamente:
  - Simula falha de datacenter (monthly)
  - Testa failover automático
  - Verifica RTO (target: <5 min)
  - Verifica RPO (target: <5 min dados)

Resultado: 99.999999999% (11 nines) uptime SLA
Que significar: ~350 nanosegundos downtime por ano

Custo: enorme. Só justificado para Google-scale.
```

---

## SEÇÃO 6: SÍNTESE - UPTIME É INVESTIMENTO (6 minutos)

### Checklist de Disponibilidade

1. **Medir corretamente:** Qual é uptime real? (não só "API responde")

2. **Redundância:** Single DC? Multi-region? Active-passive? Active-active?

3. **Health checks:** Como detecta falha? Latência de detecção?

4. **Failover:** Automático? Manual? Quanto tempo?

5. **Disaster recovery:** Backups? Onde? Quanto demora restaurar?

6. **Custo:** 99.9% é muito mais barato que 99.99%. Vale pra você?

### Padrão de Crescimento

```
Fase 1 (MVP): 99% (single DC, sem redundância)
Fase 2 (Escala): 99.9% (multi-DC, active-passive)
Fase 3 (Crítico): 99.99% (multi-region, active-active)
Fase 4 (Planet-scale): 99.999% (global infrastructure, rigorous testing)
```

---

## SEÇÃO 7: RESUMO

**Uptime = investimento:** Cada 9 adicional custa exponencialmente.
**Redundância:** Múltiplas cópias, múltiplas regiões, múltiplas mídias.
**Failover:** Automático se detecta rápido, manual se não consegue.
**Disaster Recovery:** Backups geo-redundant, point-in-time recovery.
**Tradeoff:** RTO (tempo) vs RPO (dados perdidos) vs custo.

Próximo (último): Case studies. Como Netflix/Google implementaram isso na prática?

---

## EXERCÍCIO PRÁTICO: Disaster Recovery Plan

### Contexto

Plataforma educacional armazena:
- 10M usuários dados (auth, perfil)
- 100k cursos (conteúdo video, 50TB)
- 1B events (progresso, analytics)

### Tarefas

1. **SLA Target:** Para startup, qual uptime você promete? 99%? 99.9%?

2. **Estratégia de Redundância:** Single DC, multi-region? Active-passive ou active-active?

3. **Backup 3-2-1:** Onde coloca 3 cópias? Quais mídias diferentes?

4. **RTO/RPO:** Se datacenter queima:
   - Quanto tempo demora restaurar? (RTO)
   - Quanto de dados perde? (RPO)

### Gabarito Esperado

**1. SLA:** 99.9% (8.76 horas downtime/ano). Startup não consegue 99.99%+.

**2. Redundância:** Multi-region active-passive. US-East (ativo) + EU (standby com failover automático). Caro mas factível.

**3. Backup 3-2-1:**
  - Cópia 1: Production database US-East
  - Cópia 2: RDS replica EU (hot standby)
  - Cópia 3: S3 backup (daily snapshot, archived)
  - Mídias: Database, EBS, S3 ✓
  - Offsite: EU ✓

**4. RTO/RPO:**
  - Failover automático RDS: 1-2 minutos (RTO)
  - Replicação assíncrona: 5-10s lag (RPO)
  - Se précisa restaurar: 1-4 horas de S3 backup

---

