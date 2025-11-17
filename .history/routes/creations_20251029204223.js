const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const db = require('../db');

// Middleware para verificar se usuário está logado
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// Listar QRs do usuário
router.get('/', requireAuth, (req, res) => {
  const userId = req.session.user.id;

  db.all(
    'SELECT id, type, data, options, created_at FROM qrs WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Erro ao buscar QRs:', err);
        return res.status(500).json({ error: 'Erro ao buscar criações' });
      }

      // Parse dos dados JSON
      const creations = rows.map(row => ({
        id: row.id,
        type: row.type,
        data: JSON.parse(row.data),
        options: JSON.parse(row.options),
        created_at: row.created_at
      }));

      res.json({ creations });
    }
  );
});

// Baixar QR específico
router.get('/:id/download', requireAuth, async (req, res) => {
  const qrId = req.params.id;
  const userId = req.session.user.id;

  db.get(
    'SELECT * FROM qrs WHERE id = ? AND user_id = ?',
    [qrId, userId],
    async (err, row) => {
      if (err) {
        console.error('Erro ao buscar QR:', err);
        return res.status(500).json({ error: 'Erro ao buscar QR' });
      }

      if (!row) {
        return res.status(404).json({ error: 'QR não encontrado' });
      }

      try {
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
    }
  );
});

module.exports = router;
