# LIÇÃO 9.4: CI/CD Pipelines & Release - Automação Profissional

## SEÇÃO 1: INTRODUÇÃO (8 minutos)

### O Problema Real

Você termina uma feature. Toma café. Volta e:

1. Resolve conflitos de merge
2. Roda testes localmente
3. Build manualmente docker image
4. Push pra registry
5. Conecta em servidor de produção via SSH
6. Puxa código novo
7. Roda migrations
8. Reinicia aplicação
9. Testa manualmente se funcionou
10. Torce pra não ter quebrado algo

Tudo isso **à mão**. Propenso a erros. Se falhar no passo 7, toda a cadeia fica errada.

**CI/CD = Continuous Integration / Continuous Deployment**

Você faz push. Automaticamente:
- Testes rodam
- Image é buildada
- Pushed pra registry
- Deploy em staging
- Tests de integração
- Deploy em produção
- Logs monitorados

Tudo sem tocar em um servidor. Sem risco de esquecer um passo.

### Por Que CI/CD Importa

- **Velocidade:** Deploy em minutos, não horas
- **Confiabilidade:** Mesmos passos sempre
- **Rastreabilidade:** Quem deployou o quê e quando
- **Rollback rápido:** Reverter versão antiga em segundos
- **Feedback rápido:** Sabe se quebrou 5 minutos após push, não em produção

### Objetivo da Lição

Você vai entender:

- Conceitos CI/CD (stages, artifacts, deployment strategies)
- GitHub Actions (free, integrado ao Git)
- Fluxo real: commit → test → build → push → deploy
- Segredos e permissões (access tokens, IAM)
- Hands-on: Setup pipeline real pra sua app

---

## SEÇÃO 2: CONCEITOS CI/CD (16 minutos)

### Pipeline Stages

Um CI/CD pipeline tem **stages** que executam em sequência:

```
COMMIT (push pra main)
   ↓
1. CHECKOUT (clone código)
   ↓
2. BUILD (compile, install deps)
   ↓
3. TEST (unit, integration, e2e)
   ↓
4. LINT (code quality)
   ↓
5. SECURITY (scan vulnerabilities)
   ↓
6. BUILD IMAGE (docker build)
   ↓
7. PUSH (docker push pra registry)
   ↓
8. DEPLOY-STAGING (apply em staging)
   ↓
9. TEST-INTEGRATION (tests em staging real)
   ↓
10. DEPLOY-PROD (apply em produção)
   ↓
11. MONITOR (verifica saúde)
```

Se qualquer stage falha, pipeline **para**. Não continua.

### Branch Strategies

**Simples (feature branches):**
```
main (produção)
  ↑
  ├── feature/docker (sua branch)
  │   └── push → tests rodam
  │   └── revisão de code
  │   └── merge pra main
  │
  └── deploy automático
```

**Complexa (staging + prod):**
```
main (staging)     staging branch → deploy staging
  ↑
  ├── feature/xxx
  │   └── push → tests rodam
  │   └── merge pra main
  │
releases/v1.0.0 (produção)
  ↑
  └── cherry-pick de commits testados
      └── deploy produção
```

### Secrets e Segurança

**Nunca hardcode secrets em CI:**

```yaml
# NUNCA
- run: docker login -u myuser -p mypassword123

# SIM - via secrets cifrados
- run: docker login -u ${{ secrets.DOCKER_USER }} -p ${{ secrets.DOCKER_PASSWORD }}
```

Secrets são armazenados cifrados pela plataforma (GitHub, GitLab, etc).

---

## SEÇÃO 3: GITHUB ACTIONS - WORKFLOW PROFISSIONAL (20 minutos)

### Arquivo Principal: `.github/workflows/deploy.yml`

GitHub Actions é acionado por eventos (push, pull_request, schedule):

```yaml
name: CI/CD Pipeline

# Quando executar
on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'app/**'      # Rodar só se código da app mudou
      - 'Dockerfile'
      - '.github/workflows/deploy.yml'
  pull_request:
    branches: [main, develop]
  # Agendado (nightly tests)
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC diariamente

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}/tutor-ia

jobs:
  # JOB 1: Build e Test
  build-and-test:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      # 1. Checkout código
      - name: Checkout code
        uses: actions/checkout@v4

      # 2. Setup Python
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'

      # 3. Install dependencies
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov

      # 4. Run linters
      - name: Lint code
        run: |
          pip install black flake8
          black --check .
          flake8 . --max-line-length=100

      # 5. Run tests
      - name: Run tests
        run: pytest -v --cov=app --cov-report=xml

      # 6. Upload coverage
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
          fail_ci_if_error: true

      # 7. Build Docker image
      - name: Build Docker image
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest .

      # 8. Test Docker image
      - name: Test Docker image
        run: |
          docker run --rm \
            -p 8000:8000 \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} &
          sleep 5
          curl -f http://localhost:8000/health || exit 1

      # 9. Login to registry
      - name: Login to Container Registry
        if: github.event_name == 'push'  # Só pushear em push, não em PR
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 10. Push image
      - name: Push Docker image
        if: github.event_name == 'push'
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  # JOB 2: Deploy (só em main)
  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # Usar Terraform pra deploy (do 9.3)
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.6.0

      # Configure AWS credentials
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1

      # Terraform pra provisionar infra
      - name: Terraform Init
        working-directory: ./terraform
        run: terraform init

      - name: Terraform Plan
        working-directory: ./terraform
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        working-directory: ./terraform
        run: terraform apply -auto-approve tfplan

      # Setup kubectl
      - name: Setup kubectl
        run: |
          aws eks update-kubeconfig \
            --name tutor-ia-prod \
            --region us-east-1

      # Update K8s image
      - name: Update Kubernetes deployment
        run: |
          kubectl set image deployment/tutor-ia-api \
            api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n tutor-ia

      # Wait pra rollout
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/tutor-ia-api -n tutor-ia --timeout=5m

      # Health check
      - name: Health check
        run: |
          ENDPOINT=$(kubectl get service tutor-ia-service -n tutor-ia -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
          curl -f http://$ENDPOINT/health || exit 1

  # JOB 3: Notify
  notify:
    needs: [build-and-test, deploy]
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: |
            Deploy ${{ job.status }}
            Commit: ${{ github.event.head_commit.message }}
            Author: ${{ github.actor }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Explicação de Recursos Importantes

| Recurso | Função |
|---------|--------|
| **on: push** | Executa quando alguém faz push |
| **paths** | Rodar só se arquivo X mudou |
| **if: github.event_name == 'push'** | Condicional: executar só em push, não em PR |
| **needs** | Dependência entre jobs (job B aguarda job A) |
| **secrets.XXX** | Variáveis cifradas (configuradas em GitHub) |
| **artifacts** | Upload resultados (logs, coverage) |
| **cache** | Cache de dependências entre runs |

---

## SEÇÃO 4: DEPLOYMENT STRATEGIES (14 minutos)

### Blue-Green Deployment

Duas versões rodando simultaneamente:

```
Blue (v1.0.0): 100% tráfego
  ↓
Green (v1.0.1): 0% tráfego (warm-up)
  ↓
Health checks OK?
  ↓
Green (v1.0.1): 100% tráfego
Blue (v1.0.0): Shutdown
```

**Vantagem:** Rollback é instantâneo (switch de volta pra Blue)

**Em K8s (do 9.2):**
```yaml
# Service aponta pra Green enquanto aquece
# Depois muda pra Green (switch completo)
```

### Canary Deployment

Versão nova recebe % pequeno de tráfego:

```
v1.0.0: 95% tráfego
v1.0.1: 5% tráfego
  ↓
Monitorar métricas de erro
  ↓
Se OK:
  v1.0.0: 50%
  v1.0.1: 50%
  ↓
  v1.0.0: 0%
  v1.0.1: 100%
```

**Vantagem:** Detecta problemas com população pequena

**Em K8s (usando Istio/Flagger):**
```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: tutor-ia
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tutor-ia-api
  progressDeadlineSeconds: 300
  service:
    port: 80
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 5
    metrics:
    - name: error_rate
      interval: 1m
      thresholdRange:
        max: 5  # Se erro > 5%, rollback
```

### Rolling Update (Kubernetes Default)

Gradualmente substitui pods:

```
replicas: 3, versão 1.0.0
  ↓
maxSurge: 1 (pode ter 4 pods temporariamente)
  ↓
Pod (v1.0.1) criado
  ↓
Pod (v1.0.0) deletado
  ↓
Repete até todos em v1.0.1
```

---

## SEÇÃO 5: MONITORAMENTO E ROLLBACK (14 minutos)

### Definir Alertas

```yaml
- name: Monitor error rate
  if: always()
  run: |
    ERROR_RATE=$(kubectl logs deployment/tutor-ia-api -n tutor-ia | \
                  grep ERROR | wc -l)
    
    if [ $ERROR_RATE -gt 10 ]; then
      echo "Error rate too high, rolling back"
      kubectl rollout undo deployment/tutor-ia-api -n tutor-ia
      exit 1
    fi
```

### Verificar Saúde Pós-Deploy

```bash
# Verificar service respondendo
for i in {1..10}; do
  if curl -f http://endpoint/health; then
    echo "Health check passed"
    break
  fi
  echo "Retry $i..."
  sleep 5
done
```

### Rollback Automático

```yaml
- name: Rollback if health check fails
  if: failure()
  run: |
    kubectl rollout undo deployment/tutor-ia-api -n tutor-ia
    kubectl rollout status deployment/tutor-ia-api -n tutor-ia
```

---

## RESUMO E PRÓXIMOS PASSOS

**Pontos-chave:**

1. **CI/CD automatiza tudo:** Commit → Test → Build → Deploy
2. **GitHub Actions é grátis e integrado** ao Git
3. **Secrets são cifrados** pela plataforma
4. **Strategies diferentes:** Blue-green, canary, rolling
5. **Monitoramento pós-deploy** é essencial

**Próxima aula (9.5):** Serverless & Edge — Quando você não quer gerenciar servidores.

---

## EXERCÍCIO PRÁTICO: Setup GitHub Actions Pipeline

### Setup

```bash
# Seu repo já tem .github/ ?
mkdir -p .github/workflows

# Crie arquivo abaixo
```

### Passo 1: Criar Workflow

Crie `.github/workflows/deploy.yml` com conteúdo acima.

### Passo 2: Configurar Secrets

GitHub → Settings → Secrets and variables → Actions

Adicione:
- `DOCKER_USER`: seu username Docker Hub
- `DOCKER_PASSWORD`: token de acesso Docker Hub
- `AWS_ROLE_ARN`: seu role ARN (do 9.3)
- `SLACK_WEBHOOK`: URL webhook Slack (opcional)

```bash
# Gerar token Docker Hub
# Docker Hub → Settings → Security → New Access Token
```

### Passo 3: Push Code

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: setup CI/CD pipeline"
git push origin main
```

### Passo 4: Monitorar Pipeline

GitHub → Actions → Ver workflow rodando em tempo real

```
✓ Checkout
✓ Install dependencies
✓ Tests passed
✓ Lint passed
✓ Build image
✓ Push image
✓ Deploy to Kubernetes
✓ Health check passed
```

### Desafio Bônus: Slack Notifications

Configure Slack para receber notificações de deploy.

### Verificação de Sucesso

- [ ] `.github/workflows/deploy.yml` existe
- [ ] Secrets configuradas no GitHub
- [ ] Push pra main dispara pipeline
- [ ] Todos os jobs passam (3-5 min)
- [ ] Image é pushed pro registry
- [ ] K8s deployment é atualizado
- [ ] Health check passa

---

## GABARITO: Respostas Esperadas

### Log esperado de um deploy bem-sucedido:
```
✓ Checkout code
✓ Set up Python 3.11
✓ Install dependencies
✓ Lint code - passed
✓ Run tests - 45 tests passed
✓ Build Docker image
✓ Test Docker image - health check OK
✓ Login to Container Registry
✓ Push Docker image - pushed
✓ Configure AWS credentials
✓ Terraform Apply
✓ Update Kubernetes deployment
✓ Wait for rollout - deployment rolled out
✓ Health check - endpoint responded 200
✓ Notify Slack - Deploy success
```

---

## 5 QUESTÕES DE APRENDIZAGEM

**Questão 1 (choice):**
Um pipeline falha no stage "Test". O que acontece?
- A) Pipeline continua pro próximo stage
- B) Pipeline para, código não vai pra produção ✅
- C) Só notifica via email
- D) Faz rollback automático

**Questão 2 (short_answer):**
Você quer rodar testes apenas quando arquivo `app/main.py` muda. Como fazer em GitHub Actions?

*Resposta esperada:* Usar `paths:` em `on.push`. Exemplo: `paths: ['app/**', 'tests/**']`.

**Questão 3 (code_review):**
```yaml
- name: Deploy to production
  run: |
    docker login -u user -p ${{ secrets.DOCKER_PASSWORD }}
```

O que há de errado?

*Resposta:* Username está hardcoded. Usar `secrets.DOCKER_USER` também.

**Questão 4 (prediction):**
Você usa canary deployment com 5% tráfego pra v1.0.1. Depois de 10 min, erro_rate sobe pra 8%. O que acontece?
- A) Continua aumentando % de tráfego
- B) Rollback automático, volta pra v1.0.0 ✅
- C) Notifica via Slack mas continua deploy
- D) Congela em 5% até revisar

**Questão 5 (debugging):**
GitHub Actions job "Deploy" falha com "UnauthorizedOperation". Por onde começar?
- A) Verificar secrets `AWS_ROLE_ARN` e credenciais ✅
- B) Checar sintaxe YAML
- C) Aumentar timeout
- D) Rerun workflow

---

*Próxima aula: 9.5 Serverless & Edge — Deploy sem gerenciar servidores.*

*Última atualização: 2026-09-27*
