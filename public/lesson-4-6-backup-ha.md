# LIÇÃO 4.6: Backup & HA (High Availability)

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### A Realidade

Seu banco queima em produção. Você nunca fez backup. Perde dados de 6 meses. Aplicação fica offline 3 dias. Startup falha.

Ou: Backup manual, esqueceu de ontem, restaura de uma semana atrás (data loss de 7 dias).

Ou: Backup automático, mas nunca testou restauração. Na hora de precisar, dump está corrompido.

Backup não é apenas copying data — é ter **strategy, testing, monitoring, and automation.**

### O Que Você Vai Aprender

- Backup strategies: full, incremental, point-in-time recovery (PITR)
- Replicação: master-slave, active-active
- Failover automático: detectar falha, switch para replica
- RTO/RPO: Recovery Time Objective / Recovery Point Objective
- Testes de disaster recovery: validar que backup funciona

---

## SEÇÃO 2: BACKUP — ESTRATÉGIAS (12 minutos)

### Backup Completo (Full)

```bash
# PostgreSQL
pg_dump -Fc production_db > production_20240101.dump
# ou
pg_basebackup -D /backup/20240101 -Fp -Pv

# MySQL
mysqldump --all-databases > production_20240101.sql

# MongoDB
mongodump --out /backup/20240101
```

Características:
- Tamanho: gigantesco (TB para bancos grandes)
- Restauração: demora horas/dias
- Uso: backup completo semanal

### Backup Incremental

```bash
# PostgreSQL: WAL (Write-Ahead Log)
# Cada mudança é gravada em WAL antes de aplicar
# Backup é: full backup + WAL delta

# Restauração: full + replay WAL até ponto específico
pg_restore /backup/20240101_full.dump
pg_wal_replay_lsn /backup/20240101.wal # Até onde?

# MongoDB: Oplog (Operation Log)
# Cada escrita é registrada em oplog
# Replicação consome oplog para sincronizar replicas
```

Vantagem: Incremental é 10x menor; PITR (Point-In-Time Recovery) é possível.

### Backup Contínuo (WAL Streaming)

```bash
# PostgreSQL: WAL archiving em contínuo
archive_command = 'test ! -f /wal_archive/%f && cp %p /wal_archive/%f'

# Resultado: cada WAL segment é copiado para storage externo
# Replicação ou restore pode usar esses segments
```

---

## SEÇÃO 3: REPLICAÇÃO — ALTA DISPONIBILIDADE (15 minutos)

### Master-Slave (Primary-Replica)

```
[Aplicação] → [Master (Write)] → [Replica1 (Read-only)]
                              ↘ [Replica2 (Read-only)]
```

Fluxo:
1. Aplicação escreve em Master
2. Master escreve em WAL
3. Replicas consomem WAL, aplicam mudanças
4. Aplicação lê de qualquer replica (read-heavy)

Configuração PostgreSQL:
```sql
-- Master
wal_level = replica
max_wal_senders = 10
wal_keep_segments = 64

-- Replica
standby_mode = 'on'
primary_conninfo = 'host=master user=replication password=secret'
```

Benefício: Leitura scale-out (múltiplas replicas), backup não interrompe master (replica está em sync).

Problema: Falha de master = replica não promove automaticamente (precisa manual).

### Master-Master (Active-Active)

```
[Aplicação] → [Master1] ↔ [Master2]
            ↘           ↗
```

Ambos aceitam writes, sincronizam um com outro. Failover automático.

Problema: **Conflito de escrita.** Se Master1 e Master2 ambos modificam mesma linha, qual vence?

Solução:
- Last-write-wins (mais simples, pode perder dados)
- Application-level conflict resolution (complex)
- Sharding por region (cada master é responsável por uma parte)

---

## SEÇÃO 4: FAILOVER AUTOMÁTICO (12 minutos)

### Detectar Falha

```bash
# Health check: Replica tenta conectar Master a cada 5s
while true; do
  if ! pg_isready -h master; then
    echo "Master está down, promovendo replica..."
    pg_ctl promote -D /replica/data
    break
  fi
  sleep 5
done
```

### Promover Replica

```sql
-- Replica vira Master
SELECT pg_promote();

-- Depois: reconfigure DNS/load balancer
-- Aplicação conecta novo Master
-- Antigo Master (se volta) vira replica automaticamente
```

### Orquestração Automática (Patroni, etc.)

```python
# Patroni: ferramenta que monitora cluster PostgreSQL
# automatiza failover

# Setup:
# 1. 3 nós: Master + 2 Replicas
# 2. Patroni monitora cada um
# 3. Se Master cai, Patroni promove melhor Replica
# 4. DNS update automático
# 5. Aplicação reconnecta (transparente)
```

---

## SEÇÃO 5: RTO/RPO — MÉTRICAS (10 minutos)

**RTO (Recovery Time Objective):** Quanto tempo leva para estar online de novo?
**RPO (Recovery Point Objective):** Quanto tempo de data loss aceitável?

### Exemplo 1: Backup Diário

```
Backup executado 23:00
Disco falha 14:00 (dia seguinte)
Restauração leva 4 horas

RTO = 4 horas (down 14:00 até 18:00)
RPO = 15 horas (data loss: 23:00 ontem até 14:00 hoje)
```

### Exemplo 2: Replicação Contínua + Backup

```
Replicação WAL em streaming (sempre in-sync)
Se Master falha:
- Promover Replica = 30 segundos
- Dados = last write (sem data loss!)

RTO = 30 segundos
RPO = 0 (zero data loss)
```

### Trade-offs

| Estratégia | RTO | RPO | Custo | Complexidade |
|-----------|-----|-----|-------|-------------|
| Backup diário | 4h | 24h | Baixo | Baixa |
| Backup horário | 1h | 1h | Médio | Média |
| Replicação síncrona | 30s | 0 | Alto | Alta |

Escolha baseado em: **quanto tempo/data loss você pode suportar?**

---

## SEÇÃO 6: TESTE DE DISASTER RECOVERY (8 minutos)

### Validar Backup

```bash
# 1. Restaurar backup em staging (não production!)
pg_restore -d staging /backup/production_20240101.dump

# 2. Verificar integridade
SELECT COUNT(*) FROM users; -- Números fazem sentido?
SELECT COUNT(*) FROM lessons WHERE created_at > '2023-01-01'; -- Timeline OK?

# 3. Teste de aplicação
npm test -- --db=staging
# Queries funcionam? Dados estão corretos?

# 4. Benchmark performance
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';
# Índices foram restaurados?
```

### Teste de Failover

```bash
# Staging com 3 nós (Master + 2 Replicas)
# 1. Simular crash do Master
killall postgres -9

# 2. Monitorar failover automático
# Patroni deveria promover melhor Replica em <30s
psql -c "SELECT pg_is_wal_replay_paused();"
# Replica está catching up?

# 3. Reconectar aplicação
# Connection strings devem apontar para novo Master
# Testes devem passar

# 4. Trazer antigo Master de volta
# Deve sincronizar automaticamente como replica
```

---

## SEÇÃO 7: SÍNTESE — BOAS PRÁTICAS (8 minutos)

**Estratégia de Backup & HA:**

1. **RTO/RPO alvo:** Define estratégia (backup vs replicação)
2. **Backup automático:** Diário full + incremental horário
3. **Replicação:** Master-slave com 2+ replicas para read scale-out
4. **Failover:** Automático via Patroni/orchestration, ou manual com runbook
5. **Teste:** Restaurar backup mensalmente, failover anual
6. **Monitoramento:** Alertas se replica fica atrasada, backup falha

**Checklist:**

- [ ] Backup executa automaticamente
- [ ] Backup é testado (restaurar em staging regularmente)
- [ ] Replicação está sincronizada (lag < 1s)
- [ ] Failover é automático ou testado (runbook claro)
- [ ] Métricas RTO/RPO documentadas e atingíveis
- [ ] On-call engineer sabe o plano de disaster recovery

---

## EXERCÍCIO PRÁTICO

### Projeto: Infraestrutura Resiliente para Plataforma Educacional

Cenário:
- 50M usuários, 10TB dados
- SLA: 99.9% uptime (máximo 9 horas/ano downtime)
- Aplicação crítica: tutoria de IA (não pode perder respostas)

Tarefas:

1. **Definir RTO/RPO alvo** (baseado em SLA)
2. **Desenhar arquitetura:** Master-Slave com 2 replicas
3. **Plano de backup:** Full diário + WAL incremental
4. **Plano de failover:** Automático via Patroni, runbook manual
5. **Teste:** Restaurar backup, simular failover, validar integridade

---

## RESUMO

Backup sem teste é ilusão. HA sem monitoramento é frágil. Profissional = strategy clara, automated, tested, monitored. RTO/RPO definem tudo.
