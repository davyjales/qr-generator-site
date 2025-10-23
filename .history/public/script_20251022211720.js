const QRCode = require('qrcode');

document.addEventListener('DOMContentLoaded', function() {
  const qrTypeSelect = document.getElementById('qr-type');
  const qrForm = document.getElementById('qr-form');
  const generateBtn = document.getElementById('generate-btn');
  const messageDiv = document.getElementById('message');
  const qrPreview = document.getElementById('qr-preview');
  const previewText = document.getElementById('preview-text');

  let currentQR = null;
  let uploadedFileId = null;

  // Show/hide forms based on selected type
  qrTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    showForm(selectedType);
    updatePreview();
  });

  function showForm(type) {
    // Hide all forms
    document.querySelectorAll('.form-group').forEach(group => {
      group.classList.add('hidden');
    });

    // Show relevant form
    switch (type) {
      case 'url':
        document.getElementById('url-form').classList.remove('hidden');
        break;
      case 'vcard':
        document.getElementById('vcard-form').classList.remove('hidden');
        break;
      case 'file':
        document.getElementById('file-form').classList.remove('hidden');
        break;
      case 'text':
        document.getElementById('text-form').classList.remove('hidden');
        break;
      case 'wifi':
        document.getElementById('wifi-form').classList.remove('hidden');
        break;
    }
  }

  // Handle file upload for PDF/Image
  document.getElementById('file-input').addEventListener('change', async function(e) {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (response.ok) {
          uploadedFileId = result.fileId;
          showMessage('Arquivo enviado com sucesso!', 'success');
          updatePreview();
        } else {
          showMessage(result.error || 'Erro ao enviar arquivo.', 'error');
        }
      } catch (error) {
        showMessage('Erro ao enviar arquivo.', 'error');
      }
    }
  });

  // Update preview when form inputs change
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
        data = `BEGIN:VCARD\nVERSION:3.0\nFN:${document.getElementById('name').value}\nEND:VCARD`;
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

    if (data && data.trim() !== '') {
      const qrColor = document.getElementById('qr-color').value;
      const bgColor = document.getElementById('bg-color').value;

      // Clear previous QR
      qrPreview.getContext('2d').clearRect(0, 0, qrPreview.width, qrPreview.height);

      // Generate new QR
      QRCode.toCanvas(qrPreview, data, {
        color: {
          dark: qrColor,
          light: bgColor
        },
        width: 256
      }, function(error) {
        if (error) {
          console.error(error);
          previewText.textContent = 'Erro ao gerar pré-visualização.';
        } else {
          previewText.textContent = 'Pré-visualização do QR Code.';
        }
      });
    } else {
      qrPreview.getContext('2d').clearRect(0, 0, qrPreview.width, qrPreview.height);
      previewText.textContent = 'Selecione um tipo e preencha os dados para ver a pré-visualização.';
    }
  }

  // Handle form submission
  qrForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const type = qrTypeSelect.value;
    let data = {};
    let isValid = true;

    // Collect form data
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

    // Collect customization options
    const options = {
      color: document.getElementById('qr-color').value,
      bgColor: document.getElementById('bg-color').value,
      size: parseInt(document.getElementById('size').value)
    };

    // Handle logo upload
    const logoInput = document.getElementById('logo-input');
    if (logoInput.files[0]) {
      const logoFile = logoInput.files[0];
      const reader = new FileReader();
      reader.onload = function(e) {
        options.logo = e.target.result;
        generateQR(type, data, options);
      };
      reader.readAsDataURL(logoFile);
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data, options })
      });

      if (response.ok) {
        // Trigger download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `qr-code-${type}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        showMessage('QR Code gerado e baixado com sucesso!', 'success');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Erro ao gerar QR Code.', 'error');
      }
    } catch (error) {
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

  // Initialize
  showForm(qrTypeSelect.value);
});
