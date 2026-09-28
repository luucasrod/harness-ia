# LIÇÃO 3.3: Authentication & Authorization - Segurança que Funciona

## SEÇÃO 1: INTRODUÇÃO (5 minutos)

### O Problema Real

Você está desenvolvendo uma API para a plataforma educacional. Um professor completa uma lição e espera acesso privado a seus dados. Um aluno espera que outros alunos não vejam suas respostas. Seu CEO espera que um invasor não consiga roubar dados de 100 mil estudantes.

Você adiciona `if (req.user)` no handler. Funciona. Depois, percebe que qualquer um consegue acessar o endpoint de admin apenas mudando a URL. Você coloca um `checkRole()` middleware. Alguém descobre que o token não expira. Um hacker reutiliza um token roubado por 6 meses. 

A maioria dos desenvolvedores sabe que autenticação importa, mas não entende realmente como fazer. Pulam entre JWT, sessions, OAuth, 2FA sem entender trade-offs. O resultado é APIs que **parecem** seguras mas têm buracos.

### Por Que Entender Bem Importa

- Uma breach custa sua reputação e dinheiro.
- LGPD/GDPR exigem que você saiba como protege dados.
- Clientes (empresas educacionais) vão auditar suas práticas.
- Você vai trabalhar com segurança no resto da sua carreira.

Esse não é conhecimento opcional. É responsabilidade profissional.

### Objetivo da Lição

Nesta aula, você vai aprender:

- Diferença entre **autenticação** (você é quem diz) e **autorização** (você pode fazer isso).
- JWT: como funciona, quando usar, quando não usar.
- Sessions: stateful auth, quando é melhor.
- Tokens com expiração e refresh.
- Role-based access control (RBAC).
- Padrões profissionais em Express.

---

## SEÇÃO 2: AUTENTICAÇÃO vs AUTORIZAÇÃO (15 minutos)

### A Confusão Comum

**Autenticação:** Provar quem você é.  
**Autorização:** Determinar o que você pode fazer.

Exemplo com porta:

- Autenticação: Você usa uma chave para abrir a porta → você é quem diz ser.
- Autorização: Você entra, mas pode apenas ver certos arquivos → baseado no seu role.

```typescript
// Arquivo: examples/auth-vs-authz.ts

import express from 'express';

const app = express();

// AUTENTICAÇÃO: Verifica se você é quem diz ser
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // Agora sabemos quem é
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// AUTORIZAÇÃO: Verifica se você pode fazer isso
const authorizeRole = (allowedRoles: string[]) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// Uso
app.post('/api/lessons', authenticateUser, authorizeRole(['teacher', 'admin']), (req, res) => {
  // Chegou aqui = autenticado E autorizado
  res.json({ message: 'Lição criada' });
});

// ❌ Se não autenticado → 401
// ❌ Se autenticado mas não é teacher/admin → 403
// ✅ Se autenticado E é teacher/admin → 200
```

---

## SEÇÃO 3: JWT (JSON WEB TOKEN) (20 minutos)

### O Que é JWT

JWT é um padrão para tokens stateless. Em vez de armazenar sessões no servidor, o cliente armazena um token que contém informações sobre ele.

**Estrutura:** `header.payload.signature`

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwicm9sZSI6InRlYWNoZXIifQ
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Decodificando:
- Header: Tipo de token (JWT) e algoritmo (HS256).
- Payload: Dados do usuário (userId, name, role, etc.).
- Signature: Assinatura para verificar autenticidade (só servidor conhece a chave).

### Implementação com JWT

```typescript
// Arquivo: examples/jwt-pattern.ts

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-secret-super-seguro';

// Gerar token
export function generateToken(userId: string, role: string): string {
  const token = jwt.sign(
    {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000), // issued at
      exp: Math.floor(Date.now() / 1000) + 3600 // expires in 1 hour
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );

  return token;
}

// Verificar token
export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    return decoded;
  } catch (err) {
    // Token inválido, expirado, ou assinado com chave errada
    return null;
  }
}

// Middleware
export function jwtMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization scheme' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.user = decoded;
  next();
}

// Uso em rota
app.post('/api/login', async (req, res) => {
  const user = await authenticateUserWithPassword(req.body.email, req.body.password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user.id, user.role);
  res.json({ token });
});

app.get('/api/profile', jwtMiddleware, (req, res) => {
  // req.user está preenchido pelo middleware
  res.json({ userId: req.user.userId, role: req.user.role });
});
```

### Trade-offs do JWT

**Vantagens:**
- ✅ Stateless: Não precisa armazenar sessão no servidor.
- ✅ Escalável: Funciona bem com múltiplos servidores.
- ✅ Mobile-friendly: Fácil usar em apps nativos.

**Desvantagens:**
- ❌ Não pode ser revogado até expirar (se alguém roubar, compromete por 1 hora).
- ❌ Payload é apenas encoded, não criptografado (qualquer um vê).
- ❌ Se você muda a chave secreta, todos os tokens antigos ficam inválidos.

---

## SEÇÃO 4: SESSIONS vs JWT (20 minutos)

### Sessions: Stateful Auth

```typescript
// Arquivo: examples/session-pattern.ts

import session from 'express-session';

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new RedisStore({ client: redisClient }),
  cookie: {
    maxAge: 3600000, // 1 hora
    httpOnly: true,  // Não acessível via JavaScript (seguro contra XSS)
    secure: true,    // Apenas HTTPS
    sameSite: 'strict' // Proteção contra CSRF
  }
}));

// Após login bem-sucedido
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Armazena no servidor
  req.session.userId = user.id;
  req.session.role = user.role;

  res.json({ message: 'Logged in' });
});

// Verificar se autenticado
app.get('/api/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  res.json({ userId: req.session.userId, role: req.session.role });
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out' });
  });
});
```

**Trade-offs:**

- ✅ Revogável: Ao fazer logout, a sessão é deletada imediatamente.
- ✅ Seguro contra XSS: HttpOnly cookies não são acessíveis via JavaScript.
- ❌ Stateful: Precisa armazenar no servidor ou Redis.
- ❌ Não escalável em múltiplos servidores (precisa session store compartilhado).

### JWT com Refresh Token (Híbrido)

O melhor dos dois mundos: JWT para performance, refresh token para revogação:

```typescript
// Arquivo: examples/jwt-refresh-pattern.ts

// Access Token: Curta duração (15 minutos)
export function generateAccessToken(userId: string, role: string): string {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Refresh Token: Longa duração (7 dias)
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
}

// Login: Retorna ambos
app.post('/login', async (req, res) => {
  const user = await authenticateUser(req.body.email, req.body.password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Armazena refresh token no banco (para poder revogar)
  await refreshTokenRepository.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900 // 15 minutos em segundos
  });
});

// Renovar access token
app.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Verifica se refresh token foi revogado
  const stored = await refreshTokenRepository.findByToken(refreshToken);
  if (!stored || stored.revoked) {
    return res.status(401).json({ error: 'Refresh token revoked' });
  }

  const user = await getUserById(decoded.userId);
  const newAccessToken = generateAccessToken(user.id, user.role);

  res.json({ accessToken: newAccessToken, expiresIn: 900 });
});

// Logout: Revoga refresh token
app.post('/logout', (req, res) => {
  const { refreshToken } = req.body;

  await refreshTokenRepository.update(
    { token: refreshToken },
    { revoked: true }
  );

  res.json({ message: 'Logged out' });
});
```

---

## SEÇÃO 5: RBAC (ROLE-BASED ACCESS CONTROL) (15 minutos)

### Padrão Profissional

```typescript
// Arquivo: examples/rbac-pattern.ts

// Permissões por role
const permissions = {
  admin: ['create_lesson', 'edit_lesson', 'delete_lesson', 'manage_users'],
  teacher: ['create_lesson', 'edit_own_lesson'],
  student: ['view_lesson', 'submit_answer'],
  guest: ['view_lesson']
};

// Verificar se tem permissão
function hasPermission(role: string, action: string): boolean {
  return permissions[role]?.includes(action) || false;
}

// Middleware de autorização
function requirePermission(action: string) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!hasPermission(req.user.role, action)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Uso
app.post('/api/lessons', 
  jwtMiddleware,
  requirePermission('create_lesson'),
  async (req, res) => {
    // Chegou aqui = autenticado E tem permission
    const lesson = await lessonService.create(req.body);
    res.status(201).json(lesson);
  }
);

// Variação: Verificar se é o dono (para editar própria lição)
async function requireOwnership(req, res, next) {
  const lessonId = req.params.id;
  const lesson = await lessonRepository.findById(lessonId);

  if (!lesson || lesson.teacherId !== req.user.userId) {
    return res.status(403).json({ error: 'You do not own this lesson' });
  }

  next();
}

app.put('/api/lessons/:id',
  jwtMiddleware,
  requirePermission('edit_own_lesson'),
  requireOwnership,
  async (req, res) => {
    const lesson = await lessonService.update(req.params.id, req.body);
    res.json(lesson);
  }
);
```

---

## SEÇÃO 6: BOAS PRÁTICAS DE SEGURANÇA (10 minutos)

### Checklist de Segurança

1. **Nunca armazene senhas em plain text**
```typescript
const hashedPassword = await bcrypt.hash(password, 10);
const match = await bcrypt.compare(inputPassword, hashedPassword);
```

2. **Use HTTPS em produção** (forçar redirecionamento)

3. **Tokens devem ter expiração curta** (15-30 minutos para JWT)

4. **Senhas fortes** (validar comprimento, caracteres especiais)

5. **Rate limiting em login** (evitar brute force)

6. **2FA para contas críticas** (TOTP com Google Authenticator)

7. **HttpOnly, Secure, SameSite cookies** (proteção contra XSS e CSRF)

8. **Log de eventos de segurança** (logins, mudanças de role, etc.)

---

## QUIZ: 5 Perguntas

### Pergunta 1: Autenticação vs Autorização

**Qual é a diferença?**

A) São a mesma coisa, nomes diferentes.  
B) Autenticação = quem você é; Autorização = o que você pode fazer.  
C) Autenticação = senhas; Autorização = tokens.  
D) Não há diferença real.

**Resposta Correta:** B

---

### Pergunta 2: JWT Revogação

**Por que é difícil revogar um JWT?**

A) Porque JWT é criptografado.  
B) Porque servidor não armazena nada, token é válido até expirar.  
C) Porque é impossível tecnicamente.  
D) Porque JWT não tem assinatura.

**Resposta Correta:** B

---

### Pergunta 3: Refresh Token

**Qual é o propósito de um refresh token?**

A) Melhorar performance.  
B) Permitir renovação de access token curto sem fazer login novamente.  
C) Criptografar dados do usuário.  
D) Aumentar segurança eliminando a necessidade de JWT.

**Resposta Correta:** B

---

### Pergunta 4: RBAC

**Para qual é a diferença entre role e permission?**

A) Role é função (teacher), permission é ação (create_lesson).  
B) São iguais.  
C) Role é token, permission é banco.  
D) Permission é JWT, role é session.

**Resposta Correta:** A

---

### Pergunta 5: HttpOnly Cookie

**Por que HttpOnly é importante?**

A) Melhora velocidade.  
B) Protege contra XSS porque JavaScript não consegue acessar.  
C) Reduz tamanho do token.  
D) Valida email.

**Resposta Correta:** B

---

## EXERCÍCIO PRÁTICO: Implemente Auth Completo

### Desafio

Implemente um sistema de autenticação e autorização para a API educacional:

1. **Login** (email + password → access + refresh token)
2. **Refresh** (refresh token → novo access token)
3. **Protected route** (requer autenticado)
4. **RBAC** (teacher cria lição, student não)
5. **Logout** (revoga refresh token)

### Gabarito

```typescript
// src/services/auth.service.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

export async function login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);
  
  if (!user) throw new Error('User not found');
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid password');
  
  const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '15m'
  });
  
  const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
  
  // Armazena refresh token
  await refreshTokenRepository.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  
  return { accessToken, refreshToken, expiresIn: 900 };
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}
```

```typescript
// src/middleware/auth.middleware.ts
import { verifyAccessToken } from '../services/auth.service';

export async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(roles: string[]) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
```

```typescript
// src/routes/auth.routes.ts
import { Router } from 'express';
import * as authService from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const tokens = await authService.login(req.body.email, req.body.password);
    res.json(tokens);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const decoded = authService.verifyRefreshToken(req.body.refreshToken);
    const stored = await refreshTokenRepository.findByToken(req.body.refreshToken);
    
    if (!stored || stored.revoked) {
      return res.status(401).json({ error: 'Token revoked' });
    }
    
    const user = await userRepository.findById(decoded.userId);
    const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: '15m'
    });
    
    res.json({ accessToken: newAccessToken, expiresIn: 900 });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  await refreshTokenRepository.update(
    { userId: req.user.userId },
    { revoked: true }
  );
  res.json({ message: 'Logged out' });
});

export default router;
```

```typescript
// Exemplo de rota protegida
router.post('/lessons', 
  authMiddleware,
  requireRole(['teacher', 'admin']),
  async (req, res) => {
    const lesson = await lessonService.create(req.body);
    res.status(201).json(lesson);
  }
);
```

