const mysql = require('mysql2/promise');

// Configuração do pool de conexões MySQL (XAMPP)
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Usuário padrão do XAMPP
  password: '', // Senha padrão do XAMPP (vazia)
  database: 'qr_generator',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para executar queries
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
}

// Inicializar tabelas
async function initializeDatabase() {
  try {
    // Tabela de usuários
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabela users criada/verificada.');

    // Tabela de QRs
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS qrs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        data TEXT NOT NULL,
        options TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('Tabela qrs criada/verificada.');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados:', error.message);
    console.log('Certifique-se de que o XAMPP está rodando e o banco "qr_generator" existe.');
  }
}

// Testar conexão e inicializar
pool.getConnection()
  .then(connection => {
    console.log('Conectado ao banco de dados MySQL.');
    connection.release();
    initializeDatabase();
  })
  .catch(error => {
    console.error('Erro ao conectar ao banco de dados MySQL:', error.message);
    console.log('Certifique-se de que o XAMPP está rodando e o banco "qr_generator" existe.');
  });

// Exportar pool e função query
module.exports = { pool, query };
