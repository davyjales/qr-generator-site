const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const { pool } = require('../db');

// Middleware para verificar se usuário está logado
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado. Faça login para continuar.' });
  }
  next();
}

// Gerar QR Code (agora requer autenticação)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, data, options } = req.body;
    let qrData = '';

    // Prepare data based on type
    let qrId = null;
    switch (type) {
      case 'url':
        qrData = data.url;
        break;
      case 'vcard':
        // Para vCard, vamos salvar primeiro no banco e gerar URL
        // O QR Code apontará para a página web do vCard
        const dataJson = JSON.stringify(data);
        const optionsJson = JSON.stringify(options);
        const photoUrl = data.photoUrl || null;
        
        try {
          const [result] = await pool.execute(
            'INSERT INTO qrs (user_id, type, data, options, photo_url) VALUES (?, ?, ?, ?, ?)',
            [req.session.user.id, type, dataJson, optionsJson, photoUrl]
          );
          qrId = result.insertId;
          qrData = `${req.protocol}://${req.get('host')}/vcard/${qrId}`;
        } catch (err) {
          console.error('Erro ao salvar QR vCard:', err);
          return res.status(500).json({ error: 'Erro ao criar vCard' });
        }
        break;
      case 'file':
        qrData = `${req.protocol}://${req.get('host')}/download/${data.fileId}`;
        break;
      case 'text':
        qrData = data.text;
        break;
      case 'wifi':
        qrData = `WIFI:T:${data.security};S:${data.ssid};P:${data.password};;`;
        break;
      default:
        return res.status(400).json({ error: 'Invalid QR type' });
    }

    // QR options
    const qrOptions = {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: options.color || '#000000',
        light: options.bgColor || '#FFFFFF'
      },
      width: options.size || 256
    };

    // Generate QR code
    const qrBuffer = await QRCode.toBuffer(qrData, qrOptions);

    // Salvar no banco (usuário está logado) - apenas se ainda não foi salvo (vCard já foi salvo acima)
    if (type !== 'vcard') {
      const optionsJson = JSON.stringify(options);
      const dataJson = JSON.stringify(data);
      const photoUrl = data.photoUrl || null;

      try {
        await pool.execute(
          'INSERT INTO qrs (user_id, type, data, options, photo_url) VALUES (?, ?, ?, ?, ?)',
          [req.session.user.id, type, dataJson, optionsJson, photoUrl]
        );
      } catch (err) {
        console.error('Erro ao salvar QR:', err);
        // Continua mesmo se não conseguir salvar no banco
      }
    }

    // Set headers for download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-code-${type}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;
