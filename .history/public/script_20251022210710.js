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
      case 'pdf':
      case 'image':
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
      case 'pdf':
      case 'image':
        data = uploadedFileId ? `http://10.137.174.164:3000/download/${uploadedFileId}` : '';
        break;
      case 'text':
        data = document.getElementById('text-input').value;
        break;
      case 'wifi':
        data = `WIFI:T:${document.getElementById('security').value};S:${document.getElementById('ssid').value};P:${document.getElementById('password').value};;`;
        break;
    }

    if (data) {
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
