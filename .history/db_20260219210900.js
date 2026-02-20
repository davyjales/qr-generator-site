const mysql = require('mysql2/promise');

// Configuração do pool de conexões MySQL (RAILWAY)
const pool = mysql.createPool(process.env.MYSQL_URL);
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
        data MEDIUMTEXT NOT NULL,
        options MEDIUMTEXT,
        photo_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);
    console.log('Tabela qrs criada/verificada.');

    // Atualizar campos existentes de TEXT para MEDIUMTEXT (para bancos já criados)
    try {
      const [dataColumn] = await pool.execute(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'qrs' 
        AND COLUMN_NAME = 'data'
      `);
      
      if (dataColumn.length > 0 && dataColumn[0].COLUMN_TYPE === 'text') {
        await pool.execute(`ALTER TABLE qrs MODIFY COLUMN data MEDIUMTEXT NOT NULL`);
        console.log('Campo data atualizado para MEDIUMTEXT.');
      }

      const [optionsColumn] = await pool.execute(`
        SELECT COLUMN_TYPE 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'qrs' 
        AND COLUMN_NAME = 'options'
      `);
      
      if (optionsColumn.length > 0 && optionsColumn[0].COLUMN_TYPE === 'text') {
        await pool.execute(`ALTER TABLE qrs MODIFY COLUMN options MEDIUMTEXT`);
        console.log('Campo options atualizado para MEDIUMTEXT.');
      }
    } catch (error) {
      console.log('Tentando atualizar campos para MEDIUMTEXT:', error.message);
    }

    // Adicionar coluna photo_url se não existir (para bancos existentes)
    try {
      // Verificar se a coluna já existe
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'qrs' 
        AND COLUMN_NAME = 'photo_url'
      `);
      
      if (columns.length === 0) {
        await pool.execute(`
          ALTER TABLE qrs 
          ADD COLUMN photo_url VARCHAR(500)
        `);
        console.log('Coluna photo_url adicionada à tabela qrs.');
      }
    } catch (error) {
      // Ignorar erros de coluna duplicada
      if (!error.message.includes('Duplicate column name')) {
        console.log('Tentando adicionar coluna photo_url:', error.message);
      }
    }
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
