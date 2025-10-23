const express = require('express');
const router = express.Router();
const qrWithLogo = require('qr-with-logo');
const path = require('path');
const fs = require('fs');

router.post('/', async (req, res) => {
  try {
    const { type, data, options } = req.body;
    let qrData = '';

    // Prepare data based on type
    switch (type) {
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

    // If logo is provided, add it
    if (options.logo) {
      qrOptions.logo = {
        src: options.logo,
        logoSize: 0.2,
        borderRadius: 8
      };
    }

    // Generate QR code
    const qrBuffer = await qrWithLogo.generateQRWithLogo(qrData, qrOptions);

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
