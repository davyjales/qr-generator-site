const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// Middleware para verificar se usuário está logado
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// Registro
router.post('/register', async (req, res) => {
  try {
    const { email, name, username, password } = req.body;

    // Validações básicas
    if (!email || !name || !username || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    // Verificar se email ou username já existem
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', [email, username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      if (row) {
        return res.status(400).json({ error: 'Email ou username já cadastrado' });
      }

      // Hash da senha
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Inserir usuário
      db.run(
        'INSERT INTO users (email, name, username, password_hash) VALUES (?, ?, ?, ?)',
        [email, name, username, passwordHash],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Erro ao criar usuário' });
          }

          // Logar automaticamente após registro
          req.session.user = {
            id: this.lastID,
            email,
            name,
            username
          };

          res.json({ message: 'Usuário registrado com sucesso', user: req.session.user });
        }
      );
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username e senha são obrigatórios' });
    }

    // Buscar usuário por username ou email
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Erro no servidor' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Salvar na sessão
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username
      };

      res.json({ message: 'Login realizado com sucesso', user: req.session.user });
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

// Obter dados do usuário logado
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user });
});

module.exports = router;
