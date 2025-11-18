const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const qrRoutes = require('./routes/qr');
const uploadRoutes = require('./routes/upload');
const authRoutes = require('./routes/auth');
const creationsRoutes = require('./routes/creations');
const vcardRoutes = require('./routes/vcard');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessão
app.use(session({
  secret: 'qr-generator-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Em produção, usar HTTPS e secure: true
}));

// Middleware para verificar usuário logado
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Serve static files from public directory (exceto HTML principal)
app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  index: false
}));

// Routes de autenticação (não requerem login)
app.use('/api/auth', authRoutes);

// Rota pública para exibir vCards
app.use('/vcard', vcardRoutes);

// Routes que requerem autenticação
app.use('/upload', uploadRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/creations', creationsRoutes);

// Rota para página de login/registro
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para aplicação principal (requer autenticação)
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Download endpoint for files
app.get('/download/:id', (req, res) => {
  const fileId = req.params.id;
  const filePath = path.join(__dirname, 'uploads', fileId);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Serve uploaded files (profiles and files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://10.137.174.164:${PORT}`);
});
