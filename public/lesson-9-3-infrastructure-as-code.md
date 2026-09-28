# LIÇÃO 9.3: Infrastructure as Code - Terraform Profissional

## SEÇÃO 1: INTRODUÇÃO (8 minutos)

### O Problema Real

Você provisiona um cluster Kubernetes manualmente:
1. Abrir AWS console
2. Clicar em "Create VPC"
3. Configurar subnets, routing, security groups
4. Provisionar 5 instâncias EC2
5. Instalar K8s em cada uma
6. Configurar load balancer
7. Tomar screenshot de tudo pra documentação

Tudo funciona. Semana depois, precisa de outro cluster para testes. Você faz novamente.

Depois, alguém deleta um security group acidentalmente. Cluster fica sem rede. Você recria tudo, esperando não esquecer de nada.

Meses depois, precisa de rollback. Mas ninguém sabe mais qual era a configuração original.

Isso é **Infrastructure as Code (IaC):** Você **descreve** sua infraestrutura em código (Terraform), versiona no Git, applica mudanças com `terraform apply`. Reprodutível, auditável, reversível.

### Por Que Terraform?

**Alternativas:**
- CloudFormation (AWS only)
- ARM templates (Azure only)
- Pulumi (mais complex)

**Terraform:**
- Agnóstico a cloud (AWS, Azure, GCP, etc)
- Sintaxe simples (HCL)
- State management (rastreia o que você criou)
- Plan antes de apply (revise mudanças)

### Objetivo da Lição

Você vai entender:

- Conceitos IaC (declarativo, idempotente)
- Terraform: providers, resources, variables
- Estado e backends
- Modularização
- Hands-on: Provisionar VPC + K8s cluster com Terraform

---

## SEÇÃO 2: CONCEITOS FUNDAMENTAIS (16 minutos)

### Declarativo vs. Imperativo

**Imperativo** (Como fazer):
```bash
#!/bin/bash
# Script que faz passo a passo
aws ec2 create-vpc --cidr-block 10.0.0.0/16
aws ec2 create-subnet --vpc-id vpc-xxxxx --cidr-block 10.0.1.0/24
aws ec2 create-security-group --group-name allow-http ...
# ... 50 mais linhas
```

**Problema:** Se rodar novamente, tenta criar tudo de novo (erro). Se falhar no meio, estado fica inconsistente.

**Declarativo** (O que você quer):
```hcl
# Terraform - você descreve o estado desejado
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "main" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
}

resource "aws_security_group" "allow_http" {
  vpc_id = aws_vpc.main.id
  # ...
}
```

**Vantagem:** Rodar 100x = mesmo resultado. Terraform rastreia estado e só muda o necessário (idempotente).

### State: O Coração do Terraform

Terraform mantém um arquivo `.terraform/terraform.tfstate` com **o que você criou**:

```json
{
  "resources": [
    {
      "type": "aws_vpc",
      "name": "main",
      "instances": [
        {
          "attributes": {
            "id": "vpc-123456",
            "cidr_block": "10.0.0.0/16",
            "tags": { "Name": "tutor-ia" }
          }
        }
      ]
    }
  ]
}
```

**Quando você `terraform apply`:**
1. Terraform lê state atual
2. Lê seu `.tf` (desejado)
3. Calcula diferença
4. Aplica mudanças
5. Atualiza state

**Problema comum:**
```bash
# Você deleta recurso do .tf
# terraform apply → Terraform DELETA do AWS também
# Sem state, você não sabe o que foi criado
```

**Solução:**
```bash
# State remoto (em S3, Terraform Cloud, etc)
# Backup automático, locking (evita conflitos)
terraform init -backend-config="bucket=my-tfstate"
```

### Providers: Conectar a Cloud

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

provider "kubernetes" {
  host                   = aws_eks_cluster.main.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.main.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.main.token
}
```

---

## SEÇÃO 3: TERRAFORM PRÁTICO - PROVISIONAR CLUSTER AWS (22 minutos)

### Arquivo Principal: `main.tf`

```hcl
# Configuração do provider AWS
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Estado remoto em S3 (recomendado para produção)
  backend "s3" {
    bucket         = "tutor-ia-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-lock"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "tutor-ia"
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================
# VPC (Rede Virtual Private)
# ============================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# Subnets públicas (para load balancer)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnets)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-${count.index + 1}"
  }
}

# Subnets privadas (para worker nodes)
resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-${count.index + 1}"
  }
}

# ============================================
# NAT Gateway (saída internet pra private subnet)
# ============================================

resource "aws_eip" "nat" {
  count  = length(var.private_subnets)
  domain = "vpc"

  depends_on = [aws_internet_gateway.main]

  tags = {
    Name = "${var.project_name}-eip-${count.index + 1}"
  }
}

resource "aws_nat_gateway" "main" {
  count         = length(var.private_subnets)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.main]
}

# ============================================
# EKS Cluster (Kubernetes gerenciado)
# ============================================

resource "aws_eks_cluster" "main" {
  name            = var.cluster_name
  role_arn        = aws_iam_role.eks_cluster.arn
  version         = var.kubernetes_version

  vpc_config {
    subnet_ids              = concat(aws_subnet.public[*].id, aws_subnet.private[*].id)
    endpoint_private_access = true
    endpoint_public_access  = true
  }

  enabled_cluster_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy
  ]

  tags = {
    Name = var.cluster_name
  }
}

# Node Group (workers)
resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-node-group"
  node_role_arn   = aws_iam_role.eks_node.arn
  subnet_ids      = aws_subnet.private[*].id
  version         = var.kubernetes_version

  scaling_config {
    desired_size = var.desired_size
    max_size     = var.max_size
    min_size     = var.min_size
  }

  instance_types = [var.instance_type]

  # Usar latest AMI
  ami_type = "AL2_x86_64"

  tags = {
    Name = "${var.cluster_name}-node-group"
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_registry_policy
  ]
}

# ============================================
# IAM Roles (Permissões)
# ============================================

resource "aws_iam_role" "eks_cluster" {
  name = "${var.cluster_name}-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster.name
}

resource "aws_iam_role" "eks_node" {
  name = "${var.cluster_name}-node-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node.name
}

resource "aws_iam_role_policy_attachment" "eks_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node.name
}

# ============================================
# Outputs (o que retornar após apply)
# ============================================

output "cluster_endpoint" {
  value       = aws_eks_cluster.main.endpoint
  description = "Kubernetes cluster API endpoint"
}

output "cluster_name" {
  value       = aws_eks_cluster.main.name
  description = "Cluster name"
}

output "configure_kubectl" {
  value = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.main.name}"
  description = "Command to configure kubectl"
}
```

### Variáveis: `variables.tf`

```hcl
variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Environment name"
}

variable "project_name" {
  type        = string
  default     = "tutor-ia"
  description = "Project name"
}

variable "vpc_cidr" {
  type        = string
  default     = "10.0.0.0/16"
  description = "VPC CIDR block"
}

variable "public_subnets" {
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  description = "Public subnets CIDR blocks"
}

variable "private_subnets" {
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
  description = "Private subnets CIDR blocks"
}

variable "cluster_name" {
  type        = string
  default     = "tutor-ia-eks"
  description = "EKS cluster name"
}

variable "kubernetes_version" {
  type        = string
  default     = "1.28"
  description = "Kubernetes version"
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "EC2 instance type for worker nodes"
}

variable "desired_size" {
  type        = number
  default     = 3
  description = "Desired number of worker nodes"
}

variable "min_size" {
  type        = number
  default     = 1
  description = "Minimum number of worker nodes"
}

variable "max_size" {
  type        = number
  default     = 10
  description = "Maximum number of worker nodes"
}
```

### Valores Específicos: `terraform.tfvars`

```hcl
aws_region     = "us-east-1"
environment    = "production"
cluster_name   = "tutor-ia-prod"
desired_size   = 3
max_size       = 20
instance_type  = "t3.large"
```

---

## SEÇÃO 4: FLUXO TERRAFORM (12 minutos)

### Workflow Padrão

```bash
# 1. Inicializar (download providers, setup backend)
terraform init

# 2. Validar sintaxe
terraform validate

# 3. Planejar (o que vai mudar?)
terraform plan -out=tfplan

# 4. Revisar mudanças
cat tfplan

# 5. Aplicar
terraform apply tfplan

# Resultado:
# - VPC criada
# - Subnets criadas
# - IAM roles criadas
# - EKS cluster criado
# - Node group criado
# - State atualizado

# 6. Configurar kubectl
aws eks update-kubeconfig \
  --region us-east-1 \
  --name tutor-ia-prod

# 7. Verificar
kubectl get nodes
```

### Verificar Estado

```bash
# Ver recursos criados
terraform state list

# Ver detalhes de um recurso
terraform state show aws_eks_cluster.main

# Atualizar state sem changes (refresh)
terraform refresh
```

### Mudanças e Rollback

**Aumentar workers:**
```hcl
# main.tf - mudar
desired_size = 5
max_size     = 30

# Aplicar
terraform plan
terraform apply
# EKS provisiona 2 workers a mais, sem downtime
```

**Reverter:**
```bash
# Opção 1: Editar de volta
desired_size = 3

# Opção 2: Destroy tudo (cuidado!)
terraform destroy
```

### State Remoto (Produção)

**Crie S3 bucket pra state:**

```bash
# Antes de terraform init, criar:
# 1. S3 bucket
# 2. DynamoDB table (locking)

# Depois, terraform init usa backend remoto
terraform init -backend-config="bucket=my-tfstate"
```

---

## SEÇÃO 5: MODULARIZAÇÃO E BEST PRACTICES (12 minutos)

### Problema: Código Enorme

Arquivo `main.tf` com 500 linhas é impossível de manter.

**Solução:** Módulos Terraform

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars
└── modules/
    ├── vpc/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    ├── eks/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── outputs.tf
    └── iam/
        ├── main.tf
        ├── variables.tf
        └── outputs.tf
```

**Usar módulos:**

```hcl
# main.tf
module "vpc" {
  source = "./modules/vpc"
  
  project_name   = var.project_name
  vpc_cidr       = var.vpc_cidr
  public_subnets = var.public_subnets
  private_subnets = var.private_subnets
}

module "eks" {
  source = "./modules/eks"
  
  cluster_name      = var.cluster_name
  kubernetes_version = var.kubernetes_version
  instance_type     = var.instance_type
  
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  
  depends_on = [module.iam]
}
```

### Checklist de Produção

```hcl
✅ State remoto com encryption + locking
✅ Variables com defaults sensatos
✅ Outputs documentados (cluster endpoint, kubeconfig cmd)
✅ Modules por responsabilidade
✅ .gitignore: .tfstate, .tfvars.local, .terraform/
✅ Política de aprovação (terraform plan revisto antes de apply)
✅ Alertas de cost (AWS Budgets)
✅ Tags automáticas (Environment, Project, ManagedBy)
✅ Versionamento de providers (version = "~> 5.0")
✅ Documentação (README.md com setup steps)
```

---

## RESUMO E PRÓXIMOS PASSOS

**Pontos-chave:**

1. **IaC = Infraestrutura como código:** Reprodutível, versionável, auditável
2. **Terraform é declarativo:** Descreve estado desejado, idempotente
3. **State rastreia realidade:** Sem state, Terraform não sabe o que foi criado
4. **Plan antes de apply:** Revise mudanças antes de executar
5. **Modularizar:** Dividir em vpc/, eks/, iam/ por responsabilidade

**Próxima aula (9.4):** CI/CD Pipelines — Automatizar build, test, deploy.

---

## EXERCÍCIO PRÁTICO: Provisionar VPC + EKS com Terraform

### Setup

```bash
# Pré-requisitos
# - AWS account com credenciais (~/.aws/credentials)
# - terraform instalado (https://www.terraform.io/downloads)
# - aws-cli instalado

terraform version  # Verificar

# Diretório
mkdir -p terraform && cd terraform
```

### Passo 1: Criar Estrutura de Arquivos

Crie os arquivos acima em `terraform/`:
- `main.tf`
- `variables.tf`
- `terraform.tfvars`

```bash
tree terraform/
# terraform/
# ├── main.tf
# ├── variables.tf
# └── terraform.tfvars
```

### Passo 2: Inicializar

```bash
terraform init
# Downloads AWS provider ~5.0
# Cria diretório .terraform/

terraform validate
# Verifica sintaxe
```

### Passo 3: Planejar

```bash
terraform plan -out=tfplan

# Output:
# Plan: 25 to add, 0 to change, 0 to destroy.
# 
# Resources to be created:
#   + aws_vpc.main
#   + aws_subnet.public[0]
#   + aws_subnet.public[1]
#   + aws_subnet.public[2]
#   + aws_subnet.private[0]
#   + aws_subnet.private[1]
#   + aws_subnet.private[2]
#   + aws_nat_gateway.main[0] (x3)
#   + aws_eks_cluster.main
#   + aws_eks_node_group.main
#   + aws_iam_role.eks_cluster
#   + ... (mais)
```

### Passo 4: Revisar e Aplicar

```bash
# Revisar tfplan
cat tfplan | head -50

# Aplicar (vai levar ~15 minutos pra EKS)
terraform apply tfplan

# Outputs:
# cluster_endpoint = "https://xxxxx.eks.us-east-1.amazonaws.com"
# cluster_name = "tutor-ia-prod"
# configure_kubectl = "aws eks update-kubeconfig ..."
```

### Passo 5: Conectar kubectl

```bash
# Copiar comando do output acima
aws eks update-kubeconfig \
  --region us-east-1 \
  --name tutor-ia-prod

# Verificar
kubectl get nodes
# NAME                             STATUS   ROLES    AGE   VERSION
# ip-10-0-11-xxx.ec2.internal     Ready    <none>   5m    v1.28.x
# ip-10-0-12-xxx.ec2.internal     Ready    <none>   5m    v1.28.x
# ip-10-0-13-xxx.ec2.internal     Ready    <none>   5m    v1.28.x
```

### Passo 6: Deploy Aplicação (do 9.1)

```bash
# Sua app já funciona em K8s (9.2)
# Agora roda em cluster real!

kubectl create namespace tutor-ia
kubectl apply -f k8s/deployment.yaml -n tutor-ia
kubectl apply -f k8s/service.yaml -n tutor-ia

# Verificar
kubectl get pods -n tutor-ia
kubectl get svc -n tutor-ia

# Get LoadBalancer IP (leva 2-3 min)
kubectl get svc -n tutor-ia tutor-ia-service
# EXTERNAL-IP será um IP real da AWS
```

### Passo 7: Escalar e Modificar

```bash
# Aumentar workers
terraform plan  # Vê a diferença
# desired_size = 5 (em terraform.tfvars)

# Aplicar
terraform apply

# Kubernetes cria 2 workers automático
kubectl get nodes -w
```

### Desafio Bônus: Cost Estimation

```bash
# Terraform Cloud pode estimar custos
# Ou use: terraform plan | grep aws_instance

# Seu cluster custa:
# - EKS control plane: $73/mês
# - 3x t3.large nodes: ~$100/mês
# Total: ~$200/mês
```

### Cleanup (IMPORTANTE)

```bash
# Quando terminar (custa dinheiro)
terraform destroy

# Confirmar
# Type: yes

# Terraform deleta:
# - EKS cluster
# - VPC
# - Subnets
# - NAT gateways
# - IAM roles
# - Tudo que foi criado
```

### Verificação de Sucesso

- [ ] `terraform init` sucesso
- [ ] `terraform plan` mostra 25+ recursos
- [ ] `terraform apply` sem erros (~15 min)
- [ ] `kubectl get nodes` mostra 3 workers
- [ ] `kubectl apply` do seu app funciona
- [ ] `terraform destroy` limpa tudo

---

## GABARITO: Respostas Esperadas

### Output esperado após apply:
```
Apply complete! Resources: 25 added, 0 changed, 0 destroyed.

Outputs:
cluster_endpoint = "https://xxxxx.eks.us-east-1.amazonaws.com"
cluster_name = "tutor-ia-prod"
configure_kubectl = "aws eks update-kubeconfig --region us-east-1 --name tutor-ia-prod"
```

### Nodes esperados:
```bash
$ kubectl get nodes
NAME                             STATUS   ROLES    AGE   VERSION
ip-10-0-11-107.ec2.internal     Ready    <none>   3m    v1.28.1
ip-10-0-12-108.ec2.internal     Ready    <none>   3m    v1.28.1
ip-10-0-13-109.ec2.internal     Ready    <none>   3m    v1.28.1
```

---

## 5 QUESTÕES DE APRENDIZAGEM

**Questão 1 (choice):**
Qual é o papel do arquivo `terraform.tfstate`?
- A) Armazenar secrets
- B) Rastrear estado atual dos recursos ✅
- C) Definir providers
- D) Validar sintaxe HCL

**Questão 2 (short_answer):**
Você edita `terraform.tfvars` mudando `desired_size = 5` e roda `terraform apply`. O que acontece?

*Resposta esperada:* Terraform detecta a mudança, compara com state atual (3 nodes), calcula a diferença (2 nodes adicionais), e provisiona-os na AWS.

**Questão 3 (code_review):**
```hcl
resource "aws_eks_cluster" "main" {
  name       = "tutor-ia"
  role_arn   = "arn:aws:iam::123456:role/eks-cluster"
  # ... (faltam vpc_config, version, etc)
}
```

O que está faltando?

*Resposta:* vpc_config (subnets, endpoint access), kubernetes_version, enabled_cluster_log_types. Mínimo é: role_arn, vpc_config, version.

**Questão 4 (prediction):**
Você roda `terraform destroy` em produção. O que acontece?
- A) Deleta tudo que Terraform criou ✅
- B) Apenas "marca" como deleted (não remove de verdade)
- C) Cria um backup antes de deletar
- D) Pede confirmação 2x por segurança

**Questão 5 (debugging):**
`terraform apply` falha com "UnauthorizedOperation". Qual é o problema mais provável?
- A) Sintaxe HCL errada
- B) Credenciais AWS sem permissão ✅
- C) VPC CIDR já existe
- D) Kubernetes versão inválida

---

*Próxima aula: 9.4 CI/CD Pipelines — Automatizar build, test, deploy.*

*Última atualização: 2026-09-27*
