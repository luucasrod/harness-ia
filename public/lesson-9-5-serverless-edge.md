# LIÇÃO 9.5: Serverless & Edge - O Futuro da Infraestrutura

## SEÇÃO 1: INTRODUÇÃO (7 minutos)

### O Problema Real

Você provisionou um cluster Kubernetes com 3 workers (9.2-9.3). Custa $200/mês. Você usa 20% da capacidade. 80% é desperdício.

Ou pior: sua app tem picos. 95% do tempo usa 1 vCPU. Black Friday usa 50 vCPUs. Gerenciar isso é pesadelo.

**Serverless = Pay only for what you use**

Você não provisiona servidores. Você escreve funções. Plataforma:
- Auto-escalona (0 → 1000 instâncias em segundos)
- Você paga por execução (não por hora)
- Infraestrutura é responsabilidade do provider

$200/mês em K8s vira $10-20/mês em serverless (se uso baixo).

### O Que é Serverless?

Não que "não tem servidor". Tem, mas **você não gerencia**:

```
Traditional:
You provision → You manage → You monitor → You scale → Você é responsável

Serverless:
Write function → Deploy → Done. AWS/Vercel/GCP cuida do resto
```

### Objetivo da Lição

Você vai entender:

- FaaS (Functions as a Service): AWS Lambda, Google Cloud Functions
- Plataformas gerenciadas: Vercel, Netlify, Fly.io
- Edge computing: Executar perto do usuário (menor latência)
- Cold starts e warm lambdas (trade-offs)
- Hands-on: Deploy app do 9.1 em Vercel (serverless)

---

## SEÇÃO 2: SERVERLESS FUNDAMENTALS (16 minutos)

### Model de Execução

```
Traditional (Docker/K8s):
Server está SEMPRE rodando (mesmo à noite, sem tráfego)
├─ vCPU reservada
├─ Memória reservada
├─ Rede sempre disponível
└─ Custo = Tempo de execução

Serverless (Lambda):
Função roda APENAS quando chamada
├─ Não existe entre chamadas
├─ Custo = Tempo real de execução + requests
└─ Escala de 0 → n automaticamente
```

**Exemplo de custo:**
```
App tradicional (K8s):
- 3 t3.medium: $150/mês
- 1 RDS: $50/mês
Total: $200/mês (24/7, 95% ocioso)

App serverless (Lambda + DynamoDB):
- Lambda: $10.000.000 execuções grátis/mês
          + $0.20 por milhão após
- DynamoDB: ~$25/mês (on-demand)
Total: ~$30/mês
```

### Tipos de Serverless

| Tipo | Exemplo | Caso de Uso |
|------|---------|-----------|
| **FaaS** | AWS Lambda, Google Cloud Functions | Backend APIs, workers, processamento |
| **Containers Gerenciados** | AWS Fargate, Google Cloud Run | Apps containerizadas sem gerenciar K8s |
| **Platform as a Service** | Vercel, Netlify, Heroku | Nextjs, React, app simples |
| **Microserviços** | AWS API Gateway, Google Cloud Endpoints | Roteamento e orquestração de funções |

### Cold Starts e Warm Lambdas

**Cold start** = Primeira invocação (lambda inicializa):
```
Lambda recebe requisição
  ↓
AWS provoca container
  ↓
Código é carregado
  ↓
Dependências são importadas
  ↓
Handler é chamado
  ↓
Resultado retorna
LATÊNCIA: 100-1000ms
```

**Warm lambda** = Invocação subsequente (container já existe):
```
Handler é chamado diretamente
LATÊNCIA: 5-50ms
```

**Trade-off:**
- Serverless = mais barato, mas cold starts
- K8s = mais caro, mas latência previsível

---

## SEÇÃO 3: AWS LAMBDA - FaaS PROFISSIONAL (18 minutos)

### Função Lambda: Python

```python
# lambda_function.py
import json
import boto3
import os
from datetime import datetime

# Inicializar clients (fora do handler, reusa entre invocações)
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['EXERCISE_TABLE'])

def lambda_handler(event, context):
    """
    event = input da requisição (JSON)
    context = metadados da invocação (request ID, temps, etc)
    """
    
    try:
        # Parsear entrada
        body = json.loads(event.get('body', '{}'))
        question = body.get('question')
        student_answer = body.get('student_answer')
        user_id = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub')
        
        if not all([question, student_answer, user_id]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing fields'})
            }
        
        # Lógica de correção (simplificado)
        is_correct = len(student_answer) > 20
        feedback = "Resposta detalhada!" if is_correct else "Mais específico."
        
        # Salvar em DynamoDB
        table.put_item(Item={
            'userId': user_id,
            'timestamp': int(datetime.now().timestamp()),
            'question': question,
            'studentAnswer': student_answer,
            'isCorrect': is_correct,
            'feedback': feedback
        })
        
        # Responder
        return {
            'statusCode': 200,
            'body': json.dumps({
                'question': question,
                'is_correct': is_correct,
                'feedback': feedback
            })
        }
    
    except Exception as e:
        print(f"Error: {str(e)}")  # Lambda logs vai pra CloudWatch
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
```

### Deploy com SAM (Serverless Application Model)

```yaml
# template.yaml (define infraestrutura serverless)
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Parameters:
  Environment:
    Type: String
    Default: dev

Globals:
  Function:
    Timeout: 30
    MemorySize: 512
    Environment:
      Variables:
        EXERCISE_TABLE: !Ref ExerciseTable

Resources:
  # Lambda function
  TutorFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub 'tutor-ia-${Environment}'
      CodeUri: .
      Handler: lambda_function.lambda_handler
      Runtime: python3.11
      
      # Trigger: API Gateway (webhook HTTP)
      Events:
        GradeExercise:
          Type: Api
          Properties:
            Path: /grade
            Method: post
            RestApiId: !Ref TutorAPI
      
      # Permissions (IAM policy)
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref ExerciseTable

      # Environment variables
      Environment:
        Variables:
          EXERCISE_TABLE: !Ref ExerciseTable

  # API Gateway (expor lambda via HTTP)
  TutorAPI:
    Type: AWS::Serverless::Api
    Properties:
      Name: tutor-ia-api
      StageName: !Ref Environment
      TracingEnabled: true

  # DynamoDB Table (database serverless)
  ExerciseTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'exercises-${Environment}'
      BillingMode: PAY_PER_REQUEST  # Pague por uso
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: userId
          KeyType: HASH  # Partition key
        - AttributeName: timestamp
          KeyType: RANGE  # Sort key

  # CloudWatch Logs
  TutorFunctionLogs:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${TutorFunction}'
      RetentionInDays: 7  # 7 dias depois deleta logs

Outputs:
  TutorAPI:
    Description: API Gateway endpoint
    Value: !Sub 'https://${TutorAPI}.execute-api.${AWS::Region}.amazonaws.com/${Environment}/grade'
  
  ExerciseTable:
    Description: DynamoDB table name
    Value: !Ref ExerciseTable
```

**Deploy:**
```bash
# Build
sam build

# Deploy interativo (1ª vez)
sam deploy --guided
# Responde perguntas: region, stack name, etc

# Depois: push automático
sam deploy
```

### Monitorar Lambda

```bash
# Ver logs em tempo real
aws logs tail /aws/lambda/tutor-ia-dev --follow

# Ver métricas (CloudWatch)
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 60 \
  --statistics Average

# Ver cold starts
# CloudWatch Logs → Filter by "REPORT" duration > 1000ms
```

---

## SEÇÃO 4: VERCEL - PLATFORM AS A SERVICE (14 minutos)

### Deploy App Serverless em Vercel

Vercel é especializada em **Frontend + API serverless**:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy (no seu repo)
vercel --prod
```

**vercel.json:**
```json
{
  "name": "tutor-ia",
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "DATABASE_URL": {
      "required": true
    },
    "OPENAI_API_KEY": {
      "required": true
    }
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "regions": ["sfo1"]  # Rodar em região específica
}
```

**API Serverless em Vercel:**

```typescript
// api/grade.ts (Next.js API route)
import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'nodejs',
  memory: 512,
  maxDuration: 10,
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const { question, studentAnswer } = await req.json();

    // Lógica
    const isCorrect = studentAnswer.length > 20;
    const feedback = isCorrect ? "Resposta detalhada!" : "Mais específico.";

    // Conectar DB, salvar progress, etc
    // await db.exercises.create({...})

    return NextResponse.json(
      {
        question,
        is_correct: isCorrect,
        feedback,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Vantagens Vercel:**
- Frontend + Backend no mesmo lugar
- Deploy em 30 segundos (git push)
- Automático HTTPS
- CDN global
- Analíticos embutidos

---

## SEÇÃO 5: EDGE COMPUTING (13 minutos)

### O Que é Edge?

**Tradicional:**
```
Usuário em São Paulo
  ↓ (luz: 50-100ms)
Servidor em us-east-1 AWS
  ↓ Processa requisição
  ↓
Responda (50-100ms mais)
TOTAL: 100-200ms (mínimo)
```

**Edge:**
```
Usuário em São Paulo
  ↓ (luz: 5-10ms)
Edge node em São Paulo (CloudFlare, Vercel, AWS@Edge)
  ↓ Executa código (sem ir até origin)
  ↓
Responda (5-10ms)
TOTAL: 10-20ms
```

**Use cases:**
- Autenticação (JWT validation)
- Rate limiting
- Geo-blocking
- Caching
- Request rewriting
- A/B testing

### Cloudflare Workers (Edge Computing)

```typescript
// Rodar JavaScript em 200+ edge locations globalmente

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Geo-blocking: bloquear país
    const country = request.headers.get('cf-ipcountry');
    if (country === 'CN') {
      return new Response('Access denied', { status: 403 });
    }

    // Rate limiting
    const ip = request.headers.get('cf-connecting-ip');
    const cacheKey = new Request(url, { method: 'GET' });
    const cache = caches.default;

    let requestCount = await cache.match(`rate:${ip}`);
    if (requestCount) {
      let count = parseInt(await requestCount.text());
      if (count > 100) {
        return new Response('Too many requests', { status: 429 });
      }
      count++;
      await cache.put(`rate:${ip}`, new Response(count.toString()), {
        expirationTtl: 60,
      });
    } else {
      await cache.put(`rate:${ip}`, new Response('1'), {
        expirationTtl: 60,
      });
    }

    // Forward pra origin
    return fetch(request);
  },
};
```

### Latência Comparada

```
Traditional (K8s em AWS us-east-1):
├─ São Paulo → 150ms
├─ Tokyo → 300ms
└─ Sydney → 350ms

Vercel (CDN + Edge):
├─ São Paulo → 20ms
├─ Tokyo → 25ms
└─ Sydney → 30ms

Edge (Cloudflare Workers):
├─ São Paulo → 5ms
├─ Tokyo → 10ms
└─ Sydney → 15ms
```

---

## RESUMO E PRÓXIMOS PASSOS

**Pontos-chave:**

1. **Serverless = pay per execution:** Muito mais barato pra apps com tráfego baixo/intermitente
2. **Cold starts são trade-off:** Primeira invocação é lenta, mas isso é aceitável pra maioria
3. **Lambda ideal pra:** Workers, processamento, webhooks, cron jobs
4. **Vercel ideal pra:** Frontend + API leve (Next.js, React)
5. **Edge computing:** Reduz latência drasticamente (5ms vs 150ms)

**Quando usar o quê:**
```
Serverless (Lambda/Vercel):
- App startup
- Tráfego intermitente
- Escalabilidade imprevisível
- Prototipo rápido

K8s (9.2-9.3):
- Tráfego previsível
- Latência crítica < 10ms
- Requer persistência de conexão
- Muitas dependências complexas
```

**Módulo 9 está completo!**

---

## EXERCÍCIO PRÁTICO: Deploy em Vercel (Serverless)

### Setup

```bash
# Seu app Next.js (ou criar nova)
git clone https://github.com/seu-org/tutor-ia.git
cd tutor-ia

# Instalar Vercel CLI
npm install -g vercel
```

### Passo 1: Criar Projeto Vercel

```bash
# Create account em vercel.com
# Connect GitHub account

vercel link
# Pergunta: Link to existing project? → Y
# Seleciona seu projeto
```

### Passo 2: Configurar API Serverless

Crie `pages/api/grade.ts`:

```typescript
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question, studentAnswer } = req.body;

  const isCorrect = studentAnswer.length > 20;
  const feedback = isCorrect ? "Detalhado!" : "Mais específico.";

  res.status(200).json({
    question,
    is_correct: isCorrect,
    feedback,
  });
}
```

### Passo 3: Deploy

```bash
# Push pra main (GitHub)
git add .
git commit -m "feat: serverless API"
git push origin main

# Vercel detecta push e faz deploy automático (~2 min)
# Ou manual:
vercel --prod
```

### Passo 4: Testar

```bash
# URL está no console Vercel
VERCEL_URL=https://seu-app.vercel.app

curl -X POST $VERCEL_URL/api/grade \
  -H "Content-Type: application/json" \
  -d '{"question": "O que é serverless?", "studentAnswer": "Serverless permite executar código sem provisionar servidores, pagando apenas pelo tempo de execução."}'

# Resposta:
# {
#   "question": "O que é serverless?",
#   "is_correct": true,
#   "feedback": "Detalhado!"
# }
```

### Passo 5: Monitorar

Vercel dashboard:
- Deployments: histórico de deploys
- Logs: output das funções
- Analytics: traffic, latência, erros
- Billing: quanto está custando

### Desafio Bônus: Usar AWS Lambda

```bash
# Alternativa: Deploy em AWS Lambda (mais controle, mais config)
sam build
sam deploy --guided
```

### Verificação de Sucesso

- [ ] Projeto linkado a Vercel
- [ ] `pages/api/grade.ts` existe
- [ ] Git push dispara deploy automático
- [ ] API responde em `<seu-app>.vercel.app/api/grade`
- [ ] Curl test retorna JSON correto
- [ ] Vercel dashboard mostra invocações

---

## GABARITO: Respostas Esperadas

### Resposta esperada de API:
```json
{
  "question": "O que é serverless?",
  "is_correct": true,
  "feedback": "Detalhado!"
}
```

### Vercel logs esperados:
```
GET /api/grade 200 45ms
POST /api/grade 200 32ms
POST /api/grade 400 5ms (validation error)
```

---

## 5 QUESTÕES DE APRENDIZAGEM

**Questão 1 (choice):**
Qual é o maior benefício de serverless?
- A) Melhor latência que K8s
- B) Pay only for what you use ✅
- C) Não precisa de banco de dados
- D) Mais controle que VMs

**Questão 2 (short_answer):**
Uma função Lambda demora 100ms pra executar e é chamada 1000x/mês. Qual é o custo?

*Resposta esperada:* 1000 execuções * 0.1 segundos = 100 segundos total. $0.20 por 1M segundos = 100 * $0.20 / 1000000 = ~$0.00002. Praticamente grátis. (primeiros 1M req/mês são grátis)

**Questão 3 (code_review):**
```python
def lambda_handler(event, context):
    db = connect_db()  # Conectar BD a cada invocação
    result = db.query("SELECT ...")
    return result
```

O que há de errado?

*Resposta:* Conexão é recriada a cada invocação. Mover pra fora do handler para reusar entre warm lambdas.

**Questão 4 (prediction):**
Cold start de Lambda demora 500ms. Requisição que normalmente leva 10ms agora leva 510ms. Isso é problema?
- A) Sim, sempre inaceitável
- B) Não se 510ms < SLA do serviço ✅
- C) Sim, precisa otimizar logo
- D) Lambda não consegue fazer isso

**Questão 5 (debugging):**
Função Lambda retorna 502 "Bad Gateway". Primeira coisa a verificar?
- A) CloudWatch logs da função ✅
- B) Aumentar timeout
- C) Aumentar memory
- D) Verificar DynamoDB

---

## PARABÉNS! 🎉

**Você completou o Módulo 9: DevOps & Containerization**

### O Que Você Aprendeu:

✅ **9.1 Docker** - Containerização profissional, multi-stage builds, Docker Compose  
✅ **9.2 Kubernetes** - Orquestração em escala, self-healing, rolling updates  
✅ **9.3 Terraform** - Infrastructure as Code, provisionar clusters automaticamente  
✅ **9.4 CI/CD** - GitHub Actions, automação de test/build/deploy, canary deployment  
✅ **9.5 Serverless** - Lambda, Vercel, edge computing, pay-per-execution  

### Você Agora Consegue:

1. **Encapsular aplicação em Docker** (9.1)
2. **Orquestrar centenas de containers** em produção (9.2)
3. **Provisionar infraestrutura completa** com código (9.3)
4. **Automatizar deploy** de forma confiável (9.4)
5. **Escolher entre arquiteturas** (K8s vs serverless) de forma inteligente (9.5)

### Próximos Passos Recomendados:

- **Deep dive Kubernetes:** CKAD certification (Cloud Native Computing Foundation)
- **Deep dive Terraform:** Modularização avançada, testing (terratest)
- **Deep dive CI/CD:** GitOps (ArgoCD), feature flags (LaunchDarkly)
- **Production readiness:** Monitoring (Prometheus), tracing (Jaeger), logging (ELK)

---

*Módulo 9 completo. Parabéns! 🚀*

*Última atualização: 2026-09-27*
