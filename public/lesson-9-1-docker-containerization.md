# LIÇÃO 9.1: Docker & Containerization - Do Código ao Container

## SEÇÃO 1: INTRODUÇÃO (8 minutos)

### O Problema Real

Você escreve uma aplicação Python que funciona perfeitamente no seu laptop. Deploy em produção e descobre que o servidor usa uma versão diferente de Python, bibliotecas obsoletas, e variáveis de ambiente configuradas diferente. Ou pior: seu colega não consegue rodar o projeto localmente porque faltam 7 dependências que você esqueceu de documentar.

Esse problema é tão antigo quanto software em produção. E causou bilhões em débito técnico: "funciona na minha máquina" não é uma piada, é a realidade de 90% dos times.

Docker resolve isso de forma radical: **tudo que sua aplicação precisa — código, dependências, configuração, sistema operacional — vai em um container único e imutável**. O container funciona igual no seu laptop, no servidor de testes e em produção. Sempre.

### Por Que Docker Importa

Não é hype. Docker é a base de praticamente toda infraestrutura moderna:
- **Orquestração:** Kubernetes (9.2) gerencia containers
- **CI/CD:** Pipelines buildm e deployam containers (9.4)
- **Escalabilidade:** Rodar 1000 instâncias é trivial com containers
- **Isolamento:** Cada container é um ambiente isolado (segurança + confiabilidade)

### Objetivo da Lição

Nesta aula você vai entender:

- O que é Docker e como funciona (não é máquina virtual)
- Como construir imagens Docker profissionais
- Como orquestrar containers localmente (Docker Compose)
- Trade-offs: quando usar Docker, quando cuidado com overhead
- Hands-on: build, push, pull, e rodar um container real

---

## SEÇÃO 2: ENTENDER DOCKER (15 minutos)

### Docker vs. Máquina Virtual: Qual é a Diferença?

Começamos com um mito: **Docker NÃO é uma máquina virtual**. VMs virtualizam hardware. Docker virtualiza o sistema operacional.

```
┌─────────────────────────────────────────┐
│  SUA MÁQUINA (Host)                     │
├─────────────────────────────────────────┤
│  Sistema Operacional (Linux/Windows)    │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ VM (VirtualBox/Hyper-V)         │   │
│  │ ┌────────────────────────────┐  │   │
│  │ │ Guest OS (outro Linux)     │  │   │
│  │ ├────────────────────────────┤  │   │
│  │ │ App + Libs + Dependencies  │  │   │
│  │ └────────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Container (Docker)              │   │
│  │ ┌────────────────────────────┐  │   │
│  │ │ App + Libs + Dependencies  │  │   │
│  │ │ (compartilha OS kernel)    │  │   │
│  │ └────────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Consequência prática:**
- **VM:** ~500MB-2GB overhead (sistema completo). Lento para iniciar (minutos).
- **Container:** ~10-50MB overhead. Inicializa em milissegundos.

Para 1000 aplicações em produção, VMs custam milhões. Containers custam uma fração disso.

### Conceitos Fundamentais: Image vs. Container

**Image Docker** = Template imutável com tudo que a app precisa (bluepint)
**Container** = Instância em execução da image (objeto vivo)

Analogia:
- Image = Classe em POO
- Container = Instância da classe

```dockerfile
# Dockerfile define a IMAGE
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

Quando você `docker build`, cria uma **image**. Quando você `docker run`, cria um **container** dessa image. Pode rodar 100 containers da mesma image simultaneamente.

### Layers e o Segredo da Eficiência

Cada instrução no Dockerfile cria uma **layer**. Layers são cacheadas.

```dockerfile
FROM python:3.11-slim              # Layer 1 (base OS)
WORKDIR /app                        # Layer 2 (config)
COPY requirements.txt .             # Layer 3 (dependencies list)
RUN pip install -r requirements.txt # Layer 4 (install)
COPY . .                            # Layer 5 (app code)
CMD ["python", "main.py"]          # Layer 6 (entry point)
```

**Problema comum:**
```dockerfile
# LENTO - toda vez que muda código, recria layer de dependências
FROM python:3.11-slim
COPY . .
RUN pip install -r requirements.txt
```

**Profissional:**
```dockerfile
# RÁPIDO - dependencies só se requirements.txt mudar
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

A ordem importa porque Docker só recria layers que mudaram e seus dependentes.

---

## SEÇÃO 3: DOCKERFILE PROFISSIONAL (20 minutos)

### Exemplo Real: API FastAPI em Produção

Usamos a plataforma educacional como contexto (tutor de IA que processa respostas).

```dockerfile
# Multi-stage build - reduz tamanho final da image
FROM python:3.11-slim AS builder

WORKDIR /app
COPY requirements.txt .

# Install dependencies in isolated layer
RUN pip install --user --no-cache-dir -r requirements.txt

# ============================================
# Runtime stage (o container final)
FROM python:3.11-slim

WORKDIR /app

# Copy apenas o que precisa (não todo venv)
COPY --from=builder /root/.local /root/.local
COPY . .

# Não rodar como root (segurança)
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Python precisa saber onde estão packages
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Health check (crucial em produção)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Expor porta (documento, não força binding)
EXPOSE 8000

# Rodar a app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Análise linha por linha:**

| Aspecto | O Quê | Por Quê |
|---------|-------|--------|
| **Multi-stage** | `AS builder` + segundo `FROM` | Reduz imagem final em 50%. Primeira stage compila, segunda roda. |
| **Slim** | `python:3.11-slim` | ~150MB. `python:3.11` é ~900MB (documentação, dev tools). |
| **--user flag** | pip com `--user` | Instala em home do usuário, não global. Combinado com COPY garante isolamento. |
| **--no-cache-dir** | Remove cache pip | Poupa ~100MB na image. |
| **Não-root** | `useradd appuser` | Se container é hacked, atacante não tem acesso root. Segurança crítica. |
| **PYTHONUNBUFFERED** | Logs em real-time | Sem buffer, logs aparecem imediatamente. Crítico pra monitoramento. |
| **HEALTHCHECK** | Verifica app respondendo | Orquestrador (Kubernetes, Docker Swarm) remove containers não-saudáveis. |
| **EXPOSE** | Documentação | Não força port binding, apenas informa ao desenvolvedor. |

### Problemas Comuns e Soluções

**Problema 1: Imagem gigante**
```dockerfile
# RUIM
FROM ubuntu:22.04
RUN apt-get install python3 python3-pip
RUN pip install requests numpy pandas scikit-learn tensorflow  # 2GB+

# BOM
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt  # Exatamente o que precisa
```

**Problema 2: Secrets em hardcode**
```dockerfile
# NUNCA
ENV DATABASE_URL=postgresql://user:password@prod.db:5432/app

# SIM - via variáveis em runtime
ENV DATABASE_URL=
# Injetar via: docker run -e DATABASE_URL=... 
```

**Problema 3: Permissões de arquivo**
```dockerfile
# RUIM
RUN pip install -r requirements.txt
COPY . .
# Container roda como root, pode deletar qualquer arquivo

# BOM
RUN useradd -m appuser
COPY --chown=appuser:appuser . .
USER appuser
# Menos privilégios = menos risco
```

---

## SEÇÃO 4: DOCKER COMPOSE E ORQUESTRAÇÃO LOCAL (17 minutos)

### Por Que Docker Compose?

Uma aplicação real é rara que rode sozinha:

```
┌─────────────┐    ┌──────────────┐    ┌────────────┐
│  API (Python) │──→ │  PostgreSQL  │ ──→ │   Redis    │
└─────────────┘    └──────────────┘    └────────────┘
```

Você precisa de 3 containers rodando juntos, compartilhando rede, volumes. Docker Compose orquestra isso.

```yaml
version: '3.9'

services:
  # Aplicação API
  api:
    build: .  # Build from local Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://appuser:password@db:5432/harness_ia
      REDIS_URL: redis://cache:6379
      DEBUG: "false"
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - ./app:/app/app  # Code hot-reload em dev
      - ./logs:/app/logs
    networks:
      - app_network
    # Reinicia se morrer (importante em prod-like)
    restart: unless-stopped

  # Banco de dados PostgreSQL
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: password  # ⚠️ Usar arquivo .env, nunca hardcode
      POSTGRES_DB: harness_ia
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - app_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d harness_ia"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Cache em-memória
  cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app_network
    command: redis-server --appendonly yes

  # (Opcional) Adminer - UI pra inspecionar DB
  adminer:
    image: adminer:latest
    ports:
      - "8080:8080"
    depends_on:
      - db
    networks:
      - app_network

volumes:
  postgres_data:
  redis_data:

networks:
  app_network:
    driver: bridge
```

**Executar:**
```bash
# Build e inicia tudo
docker-compose up --build

# Em background
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Rodar comando one-off (ex: migrations)
docker-compose exec api python -m alembic upgrade head

# Parar
docker-compose down

# Limpar volumes (cuidado!)
docker-compose down -v
```

### Variáveis de Ambiente Seguras

**Nunca hardcode secrets:**

```bash
# .env.local (não committed)
DATABASE_PASSWORD=secret123
OPENAI_API_KEY=sk-...
JWT_SECRET=my_jwt_secret_...
```

```yaml
# docker-compose.yml
services:
  api:
    env_file:
      - .env.local
    environment:
      DATABASE_URL: postgresql://appuser:${DATABASE_PASSWORD}@db:5432/harness_ia
```

```bash
# Executar com segurança
source .env.local
docker-compose up
```

### Trade-off: Performance Local vs. Produção

**Local (Docker Compose):**
- Rápido de iterar
- Volume mounts permitem hot-reload
- Mas: diferentes da produção (single-machine)

**Produção (Kubernetes, descrito em 9.2):**
- Múltiplas máquinas
- Balanceamento de carga
- Self-healing
- Mas: mais complexo

Muitos bugs só aparecem em produção porque local rodava em 1 máquina e prod em 100.

---

## SEÇÃO 5: IMAGENS, REGISTRIES E BEST PRACTICES (15 minutos)

### Docker Hub e Registries Privados

Uma imagem é inútil se fica no seu laptop. Você precisa **publicar** em um registry:

```bash
# 1. Build e tag com seu username (Docker Hub)
docker build -t seu-usuario/tutor-ia:1.0.0 .

# 2. Login no Docker Hub
docker login

# 3. Push
docker push seu-usuario/tutor-ia:1.0.0

# 4. Outra máquina puxa
docker pull seu-usuario/tutor-ia:1.0.0
docker run seu-usuario/tutor-ia:1.0.0
```

**Registries privados** (empresa, GitHub):
```bash
# GitHub Container Registry
docker tag tutor-ia ghcr.io/seu-org/tutor-ia:1.0.0
docker login ghcr.io -u seu-username -p $GITHUB_TOKEN
docker push ghcr.io/seu-org/tutor-ia:1.0.0
```

### Versioning de Imagens

```bash
# Tag com versão (recomendado)
docker build -t tutor-ia:1.0.0 .
docker build -t tutor-ia:1.0 .
docker build -t tutor-ia:latest .

# Mesmo ID (latest é apenas um alias)
# Rodar sempre específico em produção, nunca latest
```

### Checklist de Produção

```dockerfile
✅ Multi-stage build (reduz tamanho)
✅ Não rodar como root
✅ HEALTHCHECK definido
✅ Secrets via env vars, não hardcode
✅ PYTHONUNBUFFERED=1 (logs em real-time)
✅ Minimal base image (slim, alpine)
✅ .dockerignore para excluir lixo
✅ Versão da imagem base pinada (não latest)
✅ Logging vai para stdout/stderr (container logs)
✅ Scan de vulnerabilidades (docker scan, trivy)
```

---

## RESUMO E PRÓXIMOS PASSOS

**Pontos-chave:**

1. **Docker encapsula tudo:** "Funciona na minha máquina" vira "Funciona em qualquer máquina"
2. **Imagens ≠ VMs:** São mais leves, iniciam mais rápido, custam menos
3. **Dockerfile é código:** Organize com layers eficientes, segurança em mente
4. **Docker Compose orquestra múltiplos containers** localmente
5. **Registries distribuem imagens** entre máquinas/equipas

**Próxima aula (9.2):** Kubernetes — quando você tem centenas de containers em produção e precisa de auto-scaling, self-healing e orquestração profissional.

---

## EXERCÍCIO PRÁTICO: Build, Push e Deploy Sua Primeira Image

### Setup

```bash
# Clonar repo (já tem tudo)
git clone https://github.com/seu-org/harness-ia.git
cd harness-ia

# Ou criar um projeto novo
mkdir meu-docker-app && cd meu-docker-app
```

### Passo 1: Dockerfile

Crie `Dockerfile` com app Python simples:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Passo 2: Código da App

Crie `main.py`:

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Exercise(BaseModel):
    question: str
    student_answer: str

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/grade")
async def grade_exercise(exercise: Exercise):
    # Simular correção
    is_correct = len(exercise.student_answer) > 10
    feedback = "Resposta detalhada!" if is_correct else "Seja mais específico."
    
    return {
        "question": exercise.question,
        "is_correct": is_correct,
        "feedback": feedback
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

Crie `requirements.txt`:

```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
requests==2.31.0
```

### Passo 3: Build

```bash
docker build -t meu-tutor-ia:1.0.0 .

# Verificar
docker images | grep meu-tutor-ia
```

### Passo 4: Rodar Localmente

```bash
# Rodar container
docker run -p 8000:8000 meu-tutor-ia:1.0.0

# Em outra terminal, testar
curl -X POST http://localhost:8000/grade \
  -H "Content-Type: application/json" \
  -d '{"question": "Qual é OOP?", "student_answer": "Programação orientada a objetos é um paradigma que agrupa dados e comportamento em objetos."}'

# Resultado esperado:
# {
#   "question": "Qual é OOP?",
#   "is_correct": true,
#   "feedback": "Resposta detalhada!"
# }
```

### Passo 5: Docker Compose com DB

Crie `docker-compose.yml`:

```yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/tutor
      PYTHONUNBUFFERED: "1"
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: tutor
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      retries: 5

volumes:
  postgres_data:
```

```bash
docker-compose up --build
```

### Desafio Bônus: Push para Docker Hub

```bash
# 1. Criar conta em Docker Hub

# 2. Build com seu username
docker build -t SEU-USUARIO/meu-tutor-ia:1.0.0 .

# 3. Login
docker login

# 4. Push
docker push SEU-USUARIO/meu-tutor-ia:1.0.0

# 5. Verificar (vai para Docker Hub público)
docker search SEU-USUARIO/meu-tutor-ia
```

### Verificação de Sucesso

- [ ] Image buildada sem erros
- [ ] Container roda `docker run -p 8000:8000 <image>`
- [ ] `curl http://localhost:8000/health` retorna `{"status": "ok"}`
- [ ] `docker ps` mostra container rodando
- [ ] Docker Compose com DB funciona (`docker-compose logs`)
- [ ] Health check está OK (`docker ps` mostra status)

---

## GABARITO: Respostas Esperadas

### Para `POST /grade`

**Entrada correta:**
```json
{
  "question": "Explique containerização",
  "student_answer": "Containerização é encapsular aplicação, dependências e config em um ambiente isolado que roda em qualquer máquina."
}
```

**Resposta esperada:**
```json
{
  "question": "Explique containerização",
  "is_correct": true,
  "feedback": "Resposta detalhada!"
}
```

**Entrada incorreta:**
```json
{
  "question": "Explique containerização",
  "student_answer": "É um negócio legal"
}
```

**Resposta esperada:**
```json
{
  "question": "Explique containerização",
  "is_correct": false,
  "feedback": "Seja mais específico."
}
```

---

## 5 QUESTÕES DE APRENDIZAGEM

**Questão 1 (choice):**
Qual é a diferença principal entre Docker e máquina virtual?
- A) Docker virtualiza hardware, VM virtualiza SO
- B) Docker virtualiza SO, VM virtualiza hardware ✅
- C) Docker é mais lento que VM
- D) Docker não pode rodar em Windows

**Questão 2 (code_review):**
```dockerfile
FROM python:3.11
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

O que há de errado nesse Dockerfile? (short_answer)

*Resposta esperada:* Usa `python:3.11` (grande) em vez de `slim`. Não roda como não-root. Sem healthcheck. Sem PYTHONUNBUFFERED.

**Questão 3 (prediction):**
Se você mudar apenas seu `main.py` e rodar `docker build`, quais layers serão recriadas?
- A) Apenas a layer de COPY . .
- B) COPY . . e todas as layers depois ✅
- C) Todas as layers
- D) Nenhuma (cache reutiliza tudo)

**Questão 4 (debugging):**
Seu container para de funcionar. Você roda `docker ps` e ele não aparece. Qual é o problema mais provável?
- A) Não bindou a porta corretamente
- B) Container crashou ou exited (tente `docker ps -a` e `docker logs <id>`) ✅
- C) Docker não está instalado
- D) Firewall bloqueando

**Questão 5 (choice):**
Em `docker-compose.yml`, qual é a função de `depends_on`?
- A) Define ordem de startup ✅
- B) Garante que serviço A espera B estar pronto (sem health check)
- C) Define permissões de rede
- D) Limita CPU/memória do serviço

---

*Próxima aula: 9.2 Kubernetes Basics — Quando você tem múltiplos containers em múltiplas máquinas.*

*Última atualização: 2026-09-27*
