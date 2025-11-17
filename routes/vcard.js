const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const path = require('path');

// Rota para exibir página do vCard (pública, não requer autenticação)
router.get('/:id', async (req, res) => {
  try {
    const qrId = req.params.id;

    // Buscar dados do vCard no banco
    const [rows] = await pool.execute(
      'SELECT * FROM qrs WHERE id = ? AND type = ?',
      [qrId, 'vcard']
    );

    if (rows.length === 0) {
      return res.status(404).send('vCard não encontrado');
    }

    const qrData = rows[0];
    const data = JSON.parse(qrData.data);
    const photoUrl = qrData.photo_url || null;
    const avatar = data.avatar || null;
    const displayInitial = (data.name || 'U').charAt(0).toUpperCase();

    // Renderizar página HTML
    res.send(`
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.name || 'Cartão de Visita'} - vCard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary-color: #ff6600;
      --primary-light: #ff8533;
      --primary-lighter: #ffa366;
      --bg-primary: #1a1a1a;
      --bg-secondary: #2d2d2d;
      --bg-tertiary: #3a3a3a;
      --bg-card: rgba(45, 45, 45, 0.95);
      --text-primary: #ffffff;
      --text-secondary: #b0b0b0;
      --text-light: #808080;
      --border-color: rgba(255, 102, 0, 0.3);
      --shadow-lg: 0 10px 20px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6);
      --shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.6), 0 10px 20px rgba(0, 0, 0, 0.7);
      --shadow-orange: 0 4px 20px rgba(255, 102, 0, 0.4), 0 2px 10px rgba(255, 102, 0, 0.3);
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
      background-attachment: fixed;
      min-height: 100vh;
      color: var(--text-primary);
      padding: 2rem 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .vcard-container {
      max-width: 600px;
      width: 100%;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 3rem 2rem;
      box-shadow: var(--shadow-xl);
      border: 1px solid var(--border-color);
      animation: slideUp 0.6s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .vcard-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .profile-image {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      border: 4px solid var(--primary-color);
      box-shadow: var(--shadow-orange);
      object-fit: cover;
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      color: var(--primary-color);
      font-weight: 700;
    }

    .profile-image img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .vcard-name {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .vcard-title {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }

    .vcard-company {
      font-size: 0.95rem;
      color: var(--primary-light);
      font-weight: 500;
    }

    .vcard-divider {
      height: 1px;
      background: var(--border-color);
      margin: 2rem 0;
    }

    .vcard-info {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      transition: all 0.3s ease;
    }

    .info-item:hover {
      border-color: var(--primary-color);
      background: var(--bg-tertiary);
      transform: translateX(5px);
    }

    .info-icon {
      font-size: 1.5rem;
      min-width: 30px;
      text-align: center;
    }

    .info-content {
      flex: 1;
    }

    .info-label {
      font-size: 0.75rem;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.25rem;
    }

    .info-value {
      font-size: 1rem;
      color: var(--text-primary);
      font-weight: 500;
      word-break: break-word;
    }

    .info-value a {
      color: var(--primary-light);
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .info-value a:hover {
      color: var(--primary-color);
      text-decoration: underline;
    }

    .vcard-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .action-btn {
      flex: 1;
      min-width: 120px;
      padding: 0.75rem 1.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: var(--shadow-orange);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-family: inherit;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(255, 102, 0, 0.5), 0 4px 15px rgba(255, 102, 0, 0.4);
      background: linear-gradient(135deg, var(--primary-light), var(--primary-lighter));
    }

    .action-btn.secondary {
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      color: var(--text-primary);
      box-shadow: none;
    }

    .action-btn.secondary:hover {
      background: var(--bg-tertiary);
      border-color: var(--primary-color);
    }

    @media (max-width: 640px) {
      .vcard-container {
        padding: 2rem 1.5rem;
      }

      .vcard-name {
        font-size: 1.5rem;
      }

      .profile-image {
        width: 120px;
        height: 120px;
        font-size: 3rem;
      }

      .vcard-actions {
        flex-direction: column;
      }

      .action-btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="vcard-container">
    <div class="vcard-header">
      <div class="profile-image">
        ${photoUrl ? `<img src="${photoUrl}" alt="${data.name || ''}" onerror="this.style.display='none'; this.parentElement.innerHTML='${avatar || displayInitial}'; this.parentElement.style.display='flex';">` : `<span>${avatar || displayInitial}</span>`}
      </div>
      <h1 class="vcard-name">${data.name || 'Nome'}</h1>
      ${data.position ? `<div class="vcard-title">${data.position}</div>` : ''}
      ${data.company ? `<div class="vcard-company">${data.company}</div>` : ''}
    </div>

    <div class="vcard-divider"></div>

    <div class="vcard-info">
      ${data.phone ? `
      <div class="info-item">
        <div class="info-icon">📞</div>
        <div class="info-content">
          <div class="info-label">Telefone</div>
          <div class="info-value"><a href="tel:${data.phone}">${data.phone}</a></div>
        </div>
      </div>
      ` : ''}
      
      ${data.email ? `
      <div class="info-item">
        <div class="info-icon">📧</div>
        <div class="info-content">
          <div class="info-label">E-mail</div>
          <div class="info-value"><a href="mailto:${data.email}">${data.email}</a></div>
        </div>
      </div>
      ` : ''}
      
      ${data.website ? `
      <div class="info-item">
        <div class="info-icon">🌐</div>
        <div class="info-content">
          <div class="info-label">Website</div>
          <div class="info-value"><a href="${data.website}" target="_blank" rel="noopener noreferrer">${data.website}</a></div>
        </div>
      </div>
      ` : ''}
      
      ${data.address ? `
      <div class="info-item">
        <div class="info-icon">📍</div>
        <div class="info-content">
          <div class="info-label">Endereço</div>
          <div class="info-value">${data.address}</div>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="vcard-actions">
      ${data.phone ? `<a href="tel:${data.phone}" class="action-btn">📞 Ligar</a>` : ''}
      ${data.email ? `<a href="mailto:${data.email}" class="action-btn">📧 E-mail</a>` : ''}
      ${data.website ? `<a href="${data.website}" target="_blank" rel="noopener noreferrer" class="action-btn secondary">🌐 Website</a>` : ''}
    </div>
  </div>
</body>
</html>
    `);
  } catch (error) {
    console.error('Erro ao buscar vCard:', error);
    res.status(500).send('Erro ao carregar vCard');
  }
});

module.exports = router;

