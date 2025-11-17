const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { pool } = require('../db');

// Middleware para verificar se usuário está logado
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// Listar QRs do usuário
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    const [rows] = await pool.execute(
      'SELECT id, type, data, options, created_at FROM qrs WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Parse dos dados JSON
    const creations = rows.map(row => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      options: JSON.parse(row.options),
      created_at: row.created_at
    }));

    res.json({ creations });
  } catch (error) {
    console.error('Erro ao buscar QRs:', error);
    res.status(500).json({ error: 'Erro ao buscar criações' });
  }
});

// Baixar QR específico
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const qrId = req.params.id;
    const userId = req.session.user.id;

    const [rows] = await pool.execute(
      'SELECT * FROM qrs WHERE id = ? AND user_id = ?',
      [qrId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'QR não encontrado' });
    }

    const row = rows[0];
    const data = JSON.parse(row.data);
    const options = JSON.parse(row.options);
    let qrData = '';

    // Recriar dados baseado no tipo
    switch (row.type) {
      case 'url':
        qrData = data.url;
        break;
      case 'vcard':
        qrData = `BEGIN:VCARD\nVERSION:3.0\nFN:${data.name}\nORG:${data.company}\nTITLE:${data.position}\nTEL:${data.phone}\nEMAIL:${data.email}\nURL:${data.website}\nADR:${data.address}\nEND:VCARD`;
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
        return res.status(400).json({ error: 'Tipo de QR inválido' });
    }

    // Opções do QR
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

    // Gerar QR code
    const qrBuffer = await QRCode.toBuffer(qrData, qrOptions);

    // Headers para download
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="qr-code-${row.type}-${qrId}.png"`);
    res.send(qrBuffer);
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: 'Erro ao gerar QR' });
  }
});

module.exports = router;
