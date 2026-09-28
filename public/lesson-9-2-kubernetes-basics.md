# LIÇÃO 9.2: Kubernetes Basics - Orquestração em Produção

## SEÇÃO 1: INTRODUÇÃO (8 minutos)

### O Problema Real (Scale)

Docker Compose funciona perfeitamente quando você tem 3-5 containers em 1 máquina. Mas o que acontece quando:

- Sua aplicação explode em traffic (Black Friday, viral)
- Você precisa rodar em 10, 100, 1000 máquinas
- Um container falha em produção — como você detecta e substitui?
- Um nó inteiro falha — como você move os containers?
- Você precisa fazer deploy zero-downtime enquanto aplicação está rodando

Esse é o mundo real de produção. Docker Compose **não faz isso**. Kubernetes faz.

### O que é Kubernetes?

Kubernetes (K8s, "oito" letras entre K e s) é um **orquestrador de containers profissional**. Ele:

- **Escalona:** Roda múltiplos containers em múltiplos nós
- **Auto-heals:** Detecta containers/nós mortos e reconstrói
- **Load-balances:** Distribui traffic entre instâncias
- **Deploy-friendly:** Rolling updates sem downtime
- **Resource-aware:** Aloca CPU/memória de forma eficiente

Criado pelo Google em 2014 (usavam algo assim internamente há 15 anos). Hoje é o padrão da indústria.

### Objetivo da Lição

Você vai entender:

- Arquitetura de Kubernetes (control plane, nodes, resources)
- Manifests YAML (como descrever o que você quer)
- Deployments, Services, Pods (building blocks)
- Health checks e self-healing
- Hands-on: Deploy sua app do 9.1 em K8s local (Minikube)

---

## SEÇÃO 2: ARQUITETURA KUBERNETES (18 minutos)

### Conceitos Fundamentais

**Pod** = Container(s) + Storage + Networking
- Unidade mínima deployável
- Geralmente 1 container por pod
- Podem compartilhar volumes/rede

**Node** = Máquina (VM/física) rodando pods
- Pode rodar múltiplos pods
- Tem CPU/memória limitados

**Cluster** = Coleção de nodes + control plane

**Control Plane** = "Cérebro" do cluster
- API Server (interface com cluster)
- etcd (banco de dados distribuído)
- Scheduler (decide onde pods rodam)
- Controller Manager (self-healing)

```
┌─────────────────────────────────────────────────────┐
│  KUBERNETES CLUSTER                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ CONTROL PLANE (master node)                  │  │
│  │ ┌──────────────┐ ┌──────────────────────┐   │  │
│  │ │ API Server   │ │ Scheduler            │   │  │
│  │ ├──────────────┤ ├──────────────────────┤   │  │
│  │ │ etcd (state) │ │ Controller Manager   │   │  │
│  │ └──────────────┘ └──────────────────────┘   │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────┬────────────────────────┐  │
│  │ NODE 1               │ NODE 2                 │  │
│  │ ┌──────────────────┐ │ ┌───────────────────┐ │  │
│  │ │ kubelet (agent)  │ │ │ kubelet            │ │  │
│  │ ├──────────────────┤ │ ├───────────────────┤ │  │
│  │ │ ┌──────┐ ┌──────┐│ │ │ ┌──────┐ ┌──────┐│ │  │
│  │ │ │Pod A │ │Pod B ││ │ │ │Pod C │ │Pod D ││ │  │
│  │ │ └──────┘ └──────┘│ │ │ └──────┘ └──────┘│ │  │
│  │ │ Docker Container │ │ │ Docker Container │ │  │
│  │ └──────────────────┘ │ └───────────────────┘ │  │
│  └──────────────────────┴────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Workflow: Do Código ao Pod Rodando

```
1. Você escreve deployment.yaml
   ↓
2. kubectl apply -f deployment.yaml
   ↓
3. API Server recebe requisição
   ↓
4. Scheduler decide: "Pod vai no node-2"
   ↓
5. kubelet (agent no node-2) recebe ordem
   ↓
6. kubelet puxa image Docker
   ↓
7. Container roda
   ↓
8. Controller Manager monitora: se morrer, reconstrói
```

### Principais Recursos Kubernetes

| Recurso | Função | Exemplo |
|---------|--------|---------|
| **Pod** | Container(s) rodando | `apiVersion: v1, kind: Pod` |
| **Deployment** | Gerencia múltiplos pods com versioning | 3 replicas da sua app |
| **Service** | Expõe pods internamente/externamente | Load balancer pra 3 pods |
| **ConfigMap** | Variáveis de config | `DATABASE_URL=...` |
| **Secret** | Variáveis sensíveis (encoded) | Senhas, API keys |
| **PersistentVolume** | Storage persistente | Banco de dados, logs |
| **Ingress** | Roteamento HTTP externo | `meu-app.com` → Service |
| **HorizontalPodAutoscaler** | Auto-scaling | Se CPU > 80%, cria mais pods |

---

## SEÇÃO 3: YAML - DESCREVENDO O QUE VOCÊ QUER (20 minutos)

### Deployment: Sua App Rodando

Lembre-se da app do 9.1. Em K8s, descreve-se com YAML:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tutor-ia-api
  labels:
    app: tutor-ia
    version: v1.0.0
spec:
  replicas: 3  # Sempre manter 3 pods em execução
  selector:
    matchLabels:
      app: tutor-ia
  
  # Template para cada pod
  template:
    metadata:
      labels:
        app: tutor-ia
        version: v1.0.0
    
    spec:
      # Security: não rodar como root
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
      
      containers:
      - name: api
        # Image (referencia ao 9.1)
        image: seu-usuario/meu-tutor-ia:1.0.0
        imagePullPolicy: IfNotPresent
        
        # Portas
        ports:
        - name: http
          containerPort: 8000
          protocol: TCP
        
        # Variáveis de ambiente
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          value: redis://cache:6379
        - name: PYTHONUNBUFFERED
          value: "1"
        
        # Health checks (crítico em produção)
        livenessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
        
        # Recursos (essencial pra scheduler funcionar)
        resources:
          requests:
            cpu: 100m      # Mínimo: 0.1 CPU
            memory: 256Mi  # Mínimo: 256 MB
          limits:
            cpu: 500m      # Máximo: 0.5 CPU
            memory: 1Gi    # Máximo: 1 GB
        
        # Lifecycle hooks
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 15"]  # Grace period pra conexões fecharem
```

**O que cada seção faz:**

- **replicas: 3** → Kubernetes mantém 3 pods em execução sempre. Se 1 morre, cria outro.
- **livenessProbe** → "App ainda está vivo?" Se /health falhar 3x, mata pod e reconstrói.
- **readinessProbe** → "App pronto pra receber tráfego?" Aguarda antes de enviar requisições.
- **resources.requests** → Scheduler precisa saber: "Reserva 100m CPU pra este pod"
- **resources.limits** → "Não pode usar mais que 500m CPU" (mata pod se exceder)

### Service: Expondo Seus Pods

Pods têm IPs que mudam. Você precisa de um "ponto de entrada" estável:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: tutor-ia-service
spec:
  type: LoadBalancer  # Expõe externamente
  selector:
    app: tutor-ia  # Encaminha pra todos os pods com label app=tutor-ia
  ports:
  - protocol: TCP
    port: 80        # Porta externa
    targetPort: 8000  # Porta no container
```

**Tipos de Service:**

| Tipo | Uso |
|------|-----|
| **ClusterIP** | Interno apenas (default) |
| **NodePort** | Expõe porta em cada nó (30000-32767) |
| **LoadBalancer** | Expõe via load balancer externo (cloud) |
| **ExternalName** | Alias pra serviço externo |

### ConfigMap e Secret: Configuração Segura

```yaml
# ConfigMap (não-sensível)
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "INFO"
  REDIS_URL: "redis://cache:6379"

---
# Secret (sensível, encoded em base64)
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
data:
  database-url: cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGI6NTQzMi9hcHA=  # base64 encoded
  api-key: c2stYWJjMTIz  # base64 encoded
```

**Diferença:**
- ConfigMap: Configuração comum (podem ser públicas)
- Secret: Senhas, tokens, chaves (criptografadas em etcd)

### Ingress: Roteamento HTTP Externo

Você quer `tutor-ia.com` → Service:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tutor-ia-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod  # HTTPS automático
spec:
  tls:
  - hosts:
    - tutor-ia.com
    secretName: tutor-ia-tls
  
  rules:
  - host: tutor-ia.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: tutor-ia-service
            port:
              number: 80
```

---

## SEÇÃO 4: SELF-HEALING E SCALING (15 minutos)

### Auto-Healing: Recuperação Automática

Kubernetes **constantemente** verifica a saúde dos seus pods:

```yaml
# Deployment já definido acima com livenessProbe
# Kubernetes faz:

1. Pod roda normalmente
   ↓
2. Health check passa: GET /health → 200 OK
   ↓
3. (5 minutos depois) App falha
   ↓
4. Health check falha: GET /health → timeout ou erro
   ↓
5. (failureThreshold: 3) Falha 3x em 30s
   ↓
6. Kubernetes mata o pod
   ↓
7. Deployment vê: "Tenho 3 replicas, só 2 estão rodando"
   ↓
8. Cria novo pod automaticamente
   ↓
9. Usuários não veem interrupção (tráfego vai pro pod que está OK)
```

### Horizontal Pod Autoscaling

Sua app fica famosa. Traffic sobe para 10x. Você quer **mais pods automaticamente**:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: tutor-ia-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: tutor-ia-api
  
  minReplicas: 3
  maxReplicas: 100
  
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 80  # Se média > 80%, escala up
  
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 85
  
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # Espera 5 min antes de reduzir
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
```

**Cenário real:**
```
13:00 → 3 pods, CPU 30% (tudo bem)
13:15 → Traffic sobe, CPU vai pra 85%
13:16 → HPA detecta, cria 3 mais pods
13:17 → 6 pods, CPU cai pra 50%
13:18 → Traffic volta ao normal
14:00 → HPA espera 5 min, reduz pra 3 pods
```

### Rolling Updates (Zero-Downtime Deploy)

Você fez fix e quer deploy nova versão (1.0.1) **sem parar a app**:

```bash
# 1. Build e push nova image
docker build -t seu-usuario/meu-tutor-ia:1.0.1 .
docker push seu-usuario/meu-tutor-ia:1.0.1

# 2. Update deployment
kubectl set image deployment/tutor-ia-api \
  api=seu-usuario/meu-tutor-ia:1.0.1

# Kubernetes faz:
# Pod 1 (v1.0.0) → Pod 1 (v1.0.1)   [traffic vai pra 2 e 3]
# Pod 2 (v1.0.0) → Pod 2 (v1.0.1)   [traffic vai pra 1 e 3]
# Pod 3 (v1.0.0) → Pod 3 (v1.0.1)   [traffic vai pra 1 e 2]
# Resultado: ZERO downtime, versão nova rodando
```

**Verificar status:**
```bash
kubectl rollout status deployment/tutor-ia-api

# Ver histórico
kubectl rollout history deployment/tutor-ia-api

# Reverter se deu ruim
kubectl rollout undo deployment/tutor-ia-api
```

---

## SEÇÃO 5: TROUBLESHOOTING E BEST PRACTICES (14 minutos)

### Debugging Pods

```bash
# Ver pods rodando
kubectl get pods

# Ver detalhes de um pod
kubectl describe pod POD_NAME

# Ver logs
kubectl logs POD_NAME
kubectl logs -f POD_NAME  # Real-time

# Entrar no pod (like docker exec)
kubectl exec -it POD_NAME -- /bin/bash

# Ver eventos (o que aconteceu)
kubectl get events --sort-by='.lastTimestamp'

# Health check falhou?
kubectl get pods -o wide
# Coluna STATUS mostra o problema
```

### Checklist de Produção

```yaml
✅ Requests/Limits definidos (scheduler funciona)
✅ Health checks: livenessProbe + readinessProbe
✅ Múltiplas replicas (mínimo 3 em produção)
✅ Services + Ingress pra exposição
✅ Secrets, não hardcode
✅ Rolling updates configurados (maxSurge, maxUnavailable)
✅ Resource quotas no namespace (evita "cluster full")
✅ PersistentVolumes pra dados (logs, DB)
✅ Network policies (firewall entre pods)
✅ RBAC (quem pode fazer o quê)
```

### Trade-off: Kubernetes vs. Simpler

**Use Kubernetes se:**
- App roda em múltiplos nós (scaling)
- Precisa auto-scaling/self-healing
- Múltiplos times/services (microserviços)
- Produção com uptime crítico

**Simpler (Lambda, Render, Fly.io, etc):**
- Prototipo/startup
- App pequena
- Não precisa controlar detalha infraestrutura
- "Serverless" (descrito em 9.5)

Kubernetes tem overhead (complexity, setup time). Começar com Docker Compose, escalar pra K8s quando necessário.

---

## RESUMO E PRÓXIMOS PASSOS

**Pontos-chave:**

1. **K8s gerencia containers em escala:** Múltiplos nós, auto-scaling, self-healing
2. **Control plane toma decisões:** Scheduler, controllers, API
3. **Manifests YAML descrevem estado desejado:** Kubernetes busca manter esse estado
4. **Probes garantem saúde:** livenessProbe mata pods mortos, readinessProbe segura tráfego
5. **Rolling updates = zero-downtime deploy**

**Próxima aula (9.3):** Infrastructure as Code — Terraform para provisionar Kubernetes e infraestrutura.

---

## EXERCÍCIO PRÁTICO: Deploy sua App do 9.1 em Minikube

### Setup Local

```bash
# Install Minikube (local K8s cluster)
# macOS
brew install minikube
brew install kubectl

# Windows (via Chocolatey)
choco install minikube kubernetes-cli

# Start Minikube
minikube start --cpus 4 --memory 8192

# Check status
minikube status
kubectl cluster-info
```

### Passo 1: Preparar Image

Use a image do 9.1 ou build nova:

```bash
# Se build local, precisa estar disponível em Minikube
eval $(minikube docker-env)
docker build -t meu-tutor-ia:1.0.0 .
```

### Passo 2: Criar Namespace (Isolamento)

```bash
kubectl create namespace tutor-ia
kubectl config set-context --current --namespace=tutor-ia
```

### Passo 3: Create Manifests

Crie `k8s/` com os arquivos:

**`k8s/deployment.yaml`:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: tutor-ia-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: tutor-ia
  template:
    metadata:
      labels:
        app: tutor-ia
    spec:
      containers:
      - name: api
        image: meu-tutor-ia:1.0.0
        imagePullPolicy: Never  # Use local image
        ports:
        - containerPort: 8000
        env:
        - name: PYTHONUNBUFFERED
          value: "1"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
```

**`k8s/service.yaml`:**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: tutor-ia-service
spec:
  type: LoadBalancer
  selector:
    app: tutor-ia
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
```

### Passo 4: Deploy

```bash
# Apply manifests
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Watch pods starting
kubectl get pods -w

# Ver service
kubectl get services

# Get external IP (Minikube)
minikube service tutor-ia-service --url

# Resultado será: http://192.168.x.x:XXXXX
```

### Passo 5: Testar

```bash
# Obter URL
SERVICE_URL=$(minikube service tutor-ia-service --url)

# Testar health
curl $SERVICE_URL/health

# Testar API
curl -X POST $SERVICE_URL/grade \
  -H "Content-Type: application/json" \
  -d '{"question": "O que é K8s?", "student_answer": "Kubernetes é um orquestrador de containers que gerencia múltiplos pods em múltiplos nós."}'
```

### Passo 6: Escalar

```bash
# Ver pods
kubectl get pods

# Scale para 5 replicas
kubectl scale deployment tutor-ia-api --replicas=5

# Ver aumento em tempo real
kubectl get pods -w

# Reduce
kubectl scale deployment tutor-ia-api --replicas=3
```

### Passo 7: Update e Rollback

```bash
# (Assumindo você fez v1.0.1)
# Update image
kubectl set image deployment/tutor-ia-api api=meu-tutor-ia:1.0.1

# Watch rolling update
kubectl rollout status deployment/tutor-ia-api

# Check history
kubectl rollout history deployment/tutor-ia-api

# Se der problema, reverter
kubectl rollout undo deployment/tutor-ia-api
```

### Desafio Bônus: Simular Falha

```bash
# 1. Delete um pod
kubectl delete pod POD_NAME

# 2. Ver novo pod sendo criado
kubectl get pods -w

# 3. Tráfego continua (os 2 outros pods absorvem)
# 4. Kubernetes auto-healed!
```

### Verificação de Sucesso

- [ ] Minikube rodando (`minikube status` = running)
- [ ] 3 pods em estado "Running"
- [ ] `curl health` retorna 200
- [ ] `/grade` API funciona
- [ ] Scale pra 5, depois pra 3 (números mudam)
- [ ] Update de versão (rolling update, sem downtime)
- [ ] Simular falha, ver pod recriado

### Cleanup

```bash
kubectl delete deployment tutor-ia-api
kubectl delete service tutor-ia-service
kubectl delete namespace tutor-ia

# Ou parar Minikube
minikube stop
```

---

## GABARITO: Respostas Esperadas

### Logs esperados no `kubectl logs`:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Health check esperado:
```bash
$ curl $SERVICE_URL/health
{"status":"ok"}
```

### Scaling esperado:
```bash
$ kubectl get pods
NAME                              READY   STATUS    RESTARTS   AGE
tutor-ia-api-xxxxx-aaaaa          1/1     Running   0          2m
tutor-ia-api-xxxxx-bbbbb          1/1     Running   0          2m
tutor-ia-api-xxxxx-ccccc          1/1     Running   0          2m
```

---

## 5 QUESTÕES DE APRENDIZAGEM

**Questão 1 (choice):**
Qual é a unidade mínima deployável em Kubernetes?
- A) Container
- B) Pod ✅
- C) Node
- D) Service

**Questão 2 (short_answer):**
Você configura `replicas: 3` no seu Deployment. Um pod morre. O que Kubernetes faz?

*Resposta esperada:* Detecta que só 2 pods estão rodando (quer 3), cria novo pod automaticamente. Self-healing.

**Questão 3 (code_review):**
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 1
  periodSeconds: 1
```

Qual problema há com essa configuração?

*Resposta:* initialDelaySeconds=1 é muito curto (app pode estar ainda inicializando). periodSeconds=1 gera muitas requisições. Melhor: initialDelaySeconds=10, periodSeconds=10.

**Questão 4 (prediction):**
Você faz deploy de versão 1.0.1 com `kubectl set image`. Acontece erro. Como revertê-lo?
- A) `kubectl delete deployment` e recriar
- B) `kubectl rollout undo` ✅
- C) Editar YAML manualmente
- D) Não dá, precisa destruir cluster

**Questão 5 (debugging):**
Pod está em status "ImagePullBackOff". O que significa?
- A) Kubernetes não consegue puxar a image Docker ✅
- B) Pod foi deletado
- C) Pod está com erro de CPU
- D) Service não está configurado

---

*Próxima aula: 9.3 Infrastructure as Code — Provisionar K8s com Terraform.*

*Última atualização: 2026-09-27*
