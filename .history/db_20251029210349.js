const mysql = require('mysql2');

// Configuração da conexão MySQL (XAMPP)
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Usuário padrão do XAMPP
  password: '', // Senha padrão do XAMPP (vazia)
  database: 'qr_generator'
});

// Conectar ao banco
db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados MySQL:', err.message);
    console.log('Certifique-se de que o XAMPP está rodando e o banco "qr_generator" existe.');
  } else {
    console.log('Conectado ao banco de dados MySQL.');
    initializeDatabase();
  }
});

// Inicializar tabelas
function initializeDatabase() {
  // Tabela de usuários
  db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err.message);
    } else {
      console.log('Tabela users criada/verificada.');
    }
  });

  // Tabela de QRs
  db.query(`
    CREATE TABLE IF NOT EXISTS qrs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      data TEXT NOT NULL,
      options TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela qrs:', err.message);
    } else {
      console.log('Tabela qrs criada/verificada.');
    }
  });
}

module.exports = db;
