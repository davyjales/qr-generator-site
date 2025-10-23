document.addEventListener('DOMContentLoaded', function() {
  const qrTypeSelect = document.getElementById('qr-type');
  const qrForm = document.getElementById('qr-form');
  const generateBtn = document.getElementById('generate-btn');
  const messageDiv = document.getElementById('message');
  const qrPreview = document.getElementById('qr-preview');
  const previewText = document.getElementById('preview-text');

  let currentQR = null;
  let uploadedFileId = null;

  // Mostra/esconde formulários conforme o tipo selecionado
  qrTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    showForm(selectedType);
    updatePreview();
  });

  function showForm(type) {
    // Remove required from all inputs and textareas to prevent validation on hidden fields
    document.querySelectorAll('input[required], textarea[required]').forEach(el => el.removeAttribute('required'));

    // Hide all form groups
    document.querySelectorAll('.form-group').forEach(group => {
      group.classList.add('hidden');
    });

    // Show the selected form group
    document.getElementById(`${type}-form`)?.classList.remove('hidden');

    // Set required on the visible form's required fields
    switch(type) {
      case 'url':
        document.getElementById('url-input').setAttribute('required', '');
        break;
      case 'vcard':
        document.getElementById('name').setAttribute('required', '');
        break;
      case 'file':
        document.getElementById('file-input').setAttribute('required', '');
        break;
      case 'text':
        document.getElementById('text-input').setAttribute('required', '');
        break;
      case 'wifi':
        document.getElementById('ssid').setAttribute('required', '');
        break;
    }
  }

  // Upload de arquivo (PDF/Imagem)
  document.getElementById('file-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const result = await response.json();
        if (response.ok) {
          uploadedFileId = result.fileId;
          showMessage('Arquivo enviado com sucesso!', 'success');
          updatePreview();
        } else {
          showMessage(result.error || 'Erro ao enviar arquivo.', 'error');
        }
      } catch {
        showMessage('Erro ao enviar arquivo.', 'error');
      }
    }
  });

  // Atualiza preview quando campos mudam
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', updatePreview);
  });

  function updatePreview() {
    const type = qrTypeSelect.value;
    let data = '';

    switch (type) {
      case 'url':
        data = document.getElementById('url-input').value;
        break;
      case 'vcard':
        data = `BEGIN:VCARD\nVERSION:3.0\nFN:${document.getElementById('name').value}\nORG:${document.getElementById('company').value}\nTITLE:${document.getElementById('position').value}\nTEL:${document.getElementById('phone').value}\nEMAIL:${document.getElementById('email').value}\nURL:${document.getElementById('website').value}\nADR:${document.getElementById('address').value}\nEND:VCARD`;
        break;
      case 'file':
        data = uploadedFileId ? `http://localhost:3000/download/${uploadedFileId}` : '';
        break;
      case 'text':
        data = document.getElementById('text-input').value;
        break;
      case 'wifi':
        data = `WIFI:T:${document.getElementById('security').value};S:${document.getElementById('ssid').value};P:${document.getElementById('password').value};;`;
        break;
    }

    const ctx = qrPreview.getContext('2d');
    ctx.clearRect(0, 0, qrPreview.width, qrPreview.height);

    if (data && data.trim() !== '') {
      const qrColor = document.getElementById('qr-color').value;
      const bgColor = document.getElementById('bg-color').value;
      const size = parseInt(document.getElementById('size').value);

      // Cria container temporário
      const tempDiv = document.createElement('div');
      const qr = new QRCode(tempDiv, {
        text: data,
        width: size,
        height: size,
        colorDark: qrColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel.H
      });

      // Aguarda renderização
      setTimeout(() => {
        const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
        if (img) {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = size;
          newCanvas.height = size;
          const newCtx = newCanvas.getContext('2d');
          newCtx.drawImage(img, 0, 0, size, size);

          qrPreview.width = size;
          qrPreview.height = size;
          qrPreview.getContext('2d').drawImage(newCanvas, 0, 0);

          previewText.textContent = 'Pré-visualização do QR Code.';
        } else {
          previewText.textContent = 'Erro ao gerar pré-visualização.';
        }
      }, 200);
    } else {
      previewText.textContent = 'Selecione um tipo e preencha os dados para ver a pré-visualização.';
    }
  }

  // Submissão do formulário
  qrForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const type = qrTypeSelect.value;
    let data = {};
    let isValid = true;

    switch (type) {
      case 'url':
        data.url = document.getElementById('url-input').value;
        if (!data.url) isValid = false;
        break;
      case 'vcard':
        data = {
          name: document.getElementById('name').value,
          company: document.getElementById('company').value,
          position: document.getElementById('position').value,
          phone: document.getElementById('phone').value,
          email: document.getElementById('email').value,
          website: document.getElementById('website').value,
          address: document.getElementById('address').value
        };
        if (!data.name) isValid = false;
        break;
      case 'file':
        if (!uploadedFileId) {
          showMessage('Por favor, faça upload de um arquivo primeiro.', 'error');
          return;
        }
        data.fileId = uploadedFileId;
        break;
      case 'text':
        data.text = document.getElementById('text-input').value;
        if (!data.text) isValid = false;
        break;
      case 'wifi':
        data = {
          ssid: document.getElementById('ssid').value,
          password: document.getElementById('password').value,
          security: document.getElementById('security').value
        };
        if (!data.ssid) isValid = false;
        break;
    }

    if (!isValid) {
      showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const options = {
      color: document.getElementById('qr-color').value,
      bgColor: document.getElementById('bg-color').value,
      size: parseInt(document.getElementById('size').value)
    };

    const logoInput = document.getElementById('logo-input');
    if (logoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        options.logo = e.target.result;
        generateQR(type, data, options);
      };
      reader.readAsDataURL(logoInput.files[0]);
    } else {
      generateQR(type, data, options);
    }
  });

  async function generateQR(type, data, options) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Gerando...';

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, options })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qr-code-${type}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showMessage('QR Code gerado e baixado com sucesso!', 'success');
      } else {
        const err = await response.json();
        showMessage(err.error || 'Erro ao gerar QR Code.', 'error');
      }
    } catch {
      showMessage('Erro ao gerar QR Code.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.textContent = 'Gerar e Baixar QR Code';
    }
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 5000);
  }

  // Inicializa com o tipo padrão
  showForm(qrTypeSelect.value);
});
