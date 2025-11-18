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
      'SELECT id, type, data, options, photo_url, created_at FROM qrs WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    // Parse dos dados JSON
    const creations = rows.map(row => {
      try {
        // Verificar se o JSON está truncado (limite do TEXT antigo)
        const dataStr = row.data || '{}';
        const optionsStr = row.options || '{}';
        
        // Se o JSON está no limite de 65535, provavelmente está truncado
        if (dataStr.length >= 65535 || optionsStr.length >= 65535) {
          console.warn(`QR ${row.id} tem dados possivelmente truncados. Ignorando...`);
          return null; // Retornar null para filtrar depois
        }
        
        const data = dataStr ? JSON.parse(dataStr) : {};
        const options = optionsStr ? JSON.parse(optionsStr) : {};
        
        const creation = {
          id: row.id,
          type: row.type,
          data: data,
          options: options,
          photo_url: row.photo_url,
          created_at: row.created_at
        };

        // Para vCard, adicionar URL da página
        if (row.type === 'vcard') {
          creation.vcardUrl = `${req.protocol}://${req.get('host')}/vcard/${row.id}`;
        }

        return creation;
      } catch (parseError) {
        console.error(`Erro ao fazer parse do QR ${row.id}:`, parseError.message);
        // Retornar null para filtrar registros corrompidos
        return null;
      }
    }).filter(creation => creation !== null); // Filtrar registros nulos/corrompidos

    res.json({ creations });
  } catch (error) {
    console.error('Erro ao buscar QRs:', error);
    res.status(500).json({ error: 'Erro ao buscar criações' });
  }
});

// Obter QR específico (para edição)
router.get('/:id/edit', requireAuth, async (req, res) => {
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
    
    // Verificar se está truncado
    const dataStr = row.data || '{}';
    const optionsStr = row.options || '{}';
    
    if (dataStr.length >= 65535 || optionsStr.length >= 65535) {
      console.error(`QR ${qrId} tem dados truncados e não pode ser editado.`);
      return res.status(500).json({ error: 'Este QR Code tem dados corrompidos e não pode ser editado. Por favor, exclua e crie um novo.' });
    }
    
    // Parse seguro do JSON
    let data, options;
    try {
      data = dataStr ? JSON.parse(dataStr) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de data do QR ${qrId}:`, e.message);
      return res.status(500).json({ error: 'Dados do QR Code corrompidos. Por favor, exclua e crie um novo.' });
    }
    
    try {
      options = optionsStr ? JSON.parse(optionsStr) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de options do QR ${qrId}:`, e.message);
      options = { color: '#000000', bgColor: '#FFFFFF', size: 256 };
    }

    res.json({
      id: row.id,
      type: row.type,
      data: data,
      options: options,
      photo_url: row.photo_url,
      created_at: row.created_at
    });
  } catch (error) {
    console.error('Erro ao buscar QR:', error);
    res.status(500).json({ error: 'Erro ao buscar QR' });
  }
});

// Obter imagem do QR code (para exibir na lista)
router.get('/:id/image', requireAuth, async (req, res) => {
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
    
    // Verificar se está truncado
    const dataStr = row.data || '{}';
    const optionsStr = row.options || '{}';
    
    if (dataStr.length >= 65535 || optionsStr.length >= 65535) {
      console.error(`QR ${qrId} tem dados truncados. Usando valores padrão.`);
      // Usar valores padrão para QRs corrompidos
      const defaultData = row.type === 'url' ? { url: 'https://example.com' } : 
                         row.type === 'text' ? { text: 'Texto corrompido' } : 
                         row.type === 'wifi' ? { ssid: 'WiFi', password: '', security: 'nopass' } : {};
      const defaultOptions = { color: '#000000', bgColor: '#FFFFFF', size: 256 };
      
      // Tentar gerar QR mesmo com dados corrompidos
      let qrData = '';
      switch (row.type) {
        case 'url':
          qrData = defaultData.url;
          break;
        case 'vcard':
          qrData = `${req.protocol}://${req.get('host')}/vcard/${row.id}`;
          break;
        case 'file':
          qrData = `${req.protocol}://${req.get('host')}/download/corrupted`;
          break;
        case 'text':
          qrData = defaultData.text;
          break;
        case 'wifi':
          qrData = `WIFI:T:${defaultData.security};S:${defaultData.ssid};P:${defaultData.password};;`;
          break;
        default:
          qrData = 'Dados corrompidos';
      }
      
      const qrOptions = {
        errorCorrectionLevel: 'M',
        type: 'png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: defaultOptions.color,
          light: defaultOptions.bgColor
        },
        width: 200
      };
      
      const qrBuffer = await QRCode.toBuffer(qrData, qrOptions);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(qrBuffer);
    }
    
    // Parse seguro do JSON
    let data, options;
    try {
      data = dataStr ? JSON.parse(dataStr) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de data do QR ${qrId} (image):`, e.message);
      return res.status(500).json({ error: 'Dados do QR Code corrompidos' });
    }
    
    try {
      options = optionsStr ? JSON.parse(optionsStr) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de options do QR ${qrId} (image):`, e.message);
      options = { color: '#000000', bgColor: '#FFFFFF', size: 256 };
    }
    
    let qrData = '';

    // Recriar dados baseado no tipo
    switch (row.type) {
      case 'url':
        qrData = data.url || '';
        break;
      case 'vcard':
        // Para vCard, usar a URL da página
        qrData = `${req.protocol}://${req.get('host')}/vcard/${row.id}`;
        break;
      case 'file':
        qrData = `${req.protocol}://${req.get('host')}/download/${data.fileId || ''}`;
        break;
      case 'text':
        qrData = data.text || '';
        break;
      case 'wifi':
        qrData = `WIFI:T:${data.security || 'nopass'};S:${data.ssid || ''};P:${data.password || ''};;`;
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
      width: 200 // Tamanho menor para exibição na lista
    };

    // Gerar QR code
    const qrBuffer = await QRCode.toBuffer(qrData, qrOptions);

    // Headers para exibição
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(qrBuffer);
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: 'Erro ao gerar QR' });
  }
});

// Atualizar QR específico
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const qrId = req.params.id;
    const userId = req.session.user.id;
    const { type, data, options } = req.body;

    // Verificar se o QR pertence ao usuário
    const [checkRows] = await pool.execute(
      'SELECT id FROM qrs WHERE id = ? AND user_id = ?',
      [qrId, userId]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'QR não encontrado' });
    }

    // Preparar dados para atualização
    const dataJson = JSON.stringify(data);
    const optionsJson = JSON.stringify(options);
    // Para vCard, usar photoUrl dos dados, caso contrário null
    const photoUrl = (type === 'vcard' && data.photoUrl) ? data.photoUrl : null;

    // Atualizar no banco
    await pool.execute(
      'UPDATE qrs SET type = ?, data = ?, options = ?, photo_url = ? WHERE id = ? AND user_id = ?',
      [type, dataJson, optionsJson, photoUrl, qrId, userId]
    );

    res.json({ success: true, message: 'QR Code atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar QR:', error);
    res.status(500).json({ error: 'Erro ao atualizar QR Code' });
  }
});

// Excluir QR específico
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const qrId = req.params.id;
    const userId = req.session.user.id;

    // Verificar se o QR pertence ao usuário
    const [checkRows] = await pool.execute(
      'SELECT id FROM qrs WHERE id = ? AND user_id = ?',
      [qrId, userId]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ error: 'QR não encontrado' });
    }

    // Excluir do banco
    await pool.execute(
      'DELETE FROM qrs WHERE id = ? AND user_id = ?',
      [qrId, userId]
    );

    res.json({ success: true, message: 'QR Code excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir QR:', error);
    res.status(500).json({ error: 'Erro ao excluir QR Code' });
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
    
    // Parse seguro do JSON
    let data, options;
    try {
      data = row.data ? JSON.parse(row.data) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de data do QR ${qrId} (download):`, e);
      return res.status(500).json({ error: 'Dados do QR Code corrompidos' });
    }
    
    try {
      options = row.options ? JSON.parse(row.options) : {};
    } catch (e) {
      console.error(`Erro ao fazer parse de options do QR ${qrId} (download):`, e);
      options = { color: '#000000', bgColor: '#FFFFFF', size: 256 };
    }
    
    let qrData = '';

    // Recriar dados baseado no tipo
    switch (row.type) {
      case 'url':
        qrData = data.url || '';
        break;
      case 'vcard':
        // Para download, usar a URL da página (mesmo que o QR code real)
        qrData = `${req.protocol}://${req.get('host')}/vcard/${row.id}`;
        break;
      case 'file':
        qrData = `${req.protocol}://${req.get('host')}/download/${data.fileId || ''}`;
        break;
      case 'text':
        qrData = data.text || '';
        break;
      case 'wifi':
        qrData = `WIFI:T:${data.security || 'nopass'};S:${data.ssid || ''};P:${data.password || ''};;`;
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
