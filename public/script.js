document.addEventListener('DOMContentLoaded', function() {
  const qrTypeSelect = document.getElementById('qr-type');
  const qrForm = document.getElementById('qr-form');
  const generateBtn = document.getElementById('generate-btn');
  const messageDiv = document.getElementById('message');
  const qrPreview = document.getElementById('qr-preview');
  const previewText = document.getElementById('preview-text');
  const navBtns = document.querySelectorAll('.nav-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const userName = document.getElementById('user-name');
  const userInitial = document.getElementById('user-initial');
  const qrColor = document.getElementById('qr-color');
  const bgColor = document.getElementById('bg-color');

  let currentUser = null;
  let uploadedFileId = null;
  let vcardPhotoUrl = null;
  let vcardAvatar = null;

  // Initialize
  checkAuthStatus();
  setupNavigation();
  setupColorPickers();
  setupFileUploads();

  // Check authentication status
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        updateUserUI();
      } else {
        // If not authenticated, redirect to login
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Erro ao verificar status de auth:', error);
      window.location.href = '/login';
    }
  }

  // Update user UI
  function updateUserUI() {
    if (currentUser) {
      userName.textContent = currentUser.name;
      userInitial.textContent = currentUser.name.charAt(0).toUpperCase();
    }
  }

  // Setup navigation
  function setupNavigation() {
    navBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const tab = this.dataset.tab;
        switchTab(tab);
      });
    });

    // Setup logout
    logoutBtn?.addEventListener('click', handleLogout);
  }

  // Switch tabs
  function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Remove active from all buttons
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }
    
    // Activate button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    if (tabName === 'creations') {
      loadCreations();
    }
  }

  // Setup color pickers
  function setupColorPickers() {
    // Update color value display
    qrColor?.addEventListener('input', function() {
      const valueDisplay = this.closest('.color-input-wrapper')?.querySelector('.color-value');
      if (valueDisplay) {
        valueDisplay.textContent = this.value.toUpperCase();
      }
      updatePreview();
    });

    bgColor?.addEventListener('input', function() {
      const valueDisplay = this.closest('.color-input-wrapper')?.querySelector('.color-value');
      if (valueDisplay) {
        valueDisplay.textContent = this.value.toUpperCase();
      }
      updatePreview();
    });
  }

  // Setup file uploads
  function setupFileUploads() {
    // File input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.addEventListener('change', handleFileUpload);
    }

    // Logo input
    const logoInput = document.getElementById('logo-input');
    if (logoInput) {
      logoInput.addEventListener('change', function() {
        updatePreview();
      });
    }

    // vCard photo input
    const vcardPhotoInput = document.getElementById('vcard-photo-input');
    if (vcardPhotoInput) {
      vcardPhotoInput.addEventListener('change', handleVCardPhotoUpload);
    }

    // Avatar selector
    const avatarGrid = document.getElementById('avatar-grid');
    if (avatarGrid) {
      const avatarOptions = avatarGrid.querySelectorAll('.avatar-option');
      avatarOptions.forEach(option => {
        option.addEventListener('click', function() {
          // Remove selected from all
          avatarOptions.forEach(opt => opt.classList.remove('selected'));
          // Add selected to clicked
          this.classList.add('selected');
          vcardAvatar = this.dataset.avatar;
          vcardPhotoUrl = null; // Clear photo when avatar is selected
          updateVCardPhotoPreview();
          updatePreview();
        });
      });
    }
  }

  // Handle file upload
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

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
      console.error('Erro ao enviar arquivo:', error);
      showMessage('Erro ao enviar arquivo.', 'error');
    }
  }

  // Handle vCard photo upload
  async function handleVCardPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await fetch('/upload/profile', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (response.ok) {
        vcardPhotoUrl = result.photoUrl;
        vcardAvatar = null; // Clear avatar when photo is uploaded
        // Remove selected from all avatars
        const avatarOptions = document.querySelectorAll('.avatar-option');
        avatarOptions.forEach(opt => opt.classList.remove('selected'));
        updateVCardPhotoPreview();
        showMessage('Foto enviada com sucesso!', 'success');
        updatePreview();
      } else {
        showMessage(result.error || 'Erro ao enviar foto.', 'error');
      }
    } catch (error) {
      console.error('Erro ao enviar foto:', error);
      showMessage('Erro ao enviar foto.', 'error');
    }
  }

  // Update vCard photo preview
  function updateVCardPhotoPreview() {
    const preview = document.getElementById('profile-photo-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const photoImg = document.getElementById('profile-photo-img');

    if (!preview || !avatarPlaceholder || !photoImg) return;

    if (vcardPhotoUrl) {
      // Show photo
      photoImg.src = vcardPhotoUrl;
      photoImg.style.display = 'block';
      avatarPlaceholder.style.display = 'none';
    } else if (vcardAvatar) {
      // Show avatar
      avatarPlaceholder.innerHTML = `<span>${vcardAvatar}</span>`;
      avatarPlaceholder.style.display = 'flex';
      photoImg.style.display = 'none';
    } else {
      // Show default
      const nameInput = document.getElementById('name');
      const name = nameInput?.value || '';
      const initial = name ? name.charAt(0).toUpperCase() : '👤';
      avatarPlaceholder.innerHTML = `<span>${initial}</span>`;
      avatarPlaceholder.style.display = 'flex';
      photoImg.style.display = 'none';
    }
  }

  // Handle logout
  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (response.ok) {
        window.location.href = '/login';
      } else {
        showMessage('Erro ao fazer logout', 'error');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      showMessage('Erro ao fazer logout', 'error');
    }
  }

  // Show/hide forms based on type
  qrTypeSelect?.addEventListener('change', function() {
    const selectedType = this.value;
    showForm(selectedType);
    updatePreview();
  });

  function showForm(type) {
    // Remove required from all inputs
    document.querySelectorAll('input[required], textarea[required]').forEach(el => {
      el.removeAttribute('required');
    });

    // Hide all form groups
    document.querySelectorAll('.form-group').forEach(group => {
      if (group.id && group.id.endsWith('-form')) {
        group.classList.add('hidden');
      }
    });

    // Show selected form group
    const selectedForm = document.getElementById(`${type}-form`);
    if (selectedForm) {
      selectedForm.classList.remove('hidden');
    }

    // Set required fields based on type
    switch(type) {
      case 'url':
        const urlInput = document.getElementById('url-input');
        if (urlInput) urlInput.setAttribute('required', '');
        break;
      case 'vcard':
        const nameInput = document.getElementById('name');
        if (nameInput) nameInput.setAttribute('required', '');
        // Update photo preview when showing vcard form
        updateVCardPhotoPreview();
        break;
      case 'file':
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.setAttribute('required', '');
        break;
      case 'text':
        const textInput = document.getElementById('text-input');
        if (textInput) textInput.setAttribute('required', '');
        break;
      case 'wifi':
        const ssidInput = document.getElementById('ssid');
        if (ssidInput) ssidInput.setAttribute('required', '');
        break;
    }
  }

  // Update preview when inputs change
  document.querySelectorAll('input, textarea, select').forEach(input => {
    input.addEventListener('input', function() {
      updatePreview();
      // If it's the name input and we're on vcard form, update photo preview
      if (input.id === 'name' && qrTypeSelect?.value === 'vcard') {
        updateVCardPhotoPreview();
      }
    });
    input.addEventListener('change', function() {
      updatePreview();
      // If it's the name input and we're on vcard form, update photo preview
      if (input.id === 'name' && qrTypeSelect?.value === 'vcard') {
        updateVCardPhotoPreview();
      }
    });
  });

  // Update preview
  function updatePreview() {
    const type = qrTypeSelect?.value;
    if (!type) return;

    let data = '';

    switch (type) {
      case 'url':
        const urlInput = document.getElementById('url-input');
        data = urlInput?.value || '';
        break;
      case 'vcard':
        // vCard preview não precisa mais gerar vCard direto
        // Apenas mostra placeholder já que será uma URL
        data = window.location.origin + '/vcard/[id]';
        break;
      case 'file':
        data = uploadedFileId ? `${window.location.origin}/download/${uploadedFileId}` : '';
        break;
      case 'text':
        const textInput = document.getElementById('text-input');
        data = textInput?.value || '';
        break;
      case 'wifi':
        const ssid = document.getElementById('ssid')?.value || '';
        const password = document.getElementById('password')?.value || '';
        const security = document.getElementById('security')?.value || 'nopass';
        data = `WIFI:T:${security};S:${ssid};P:${password};;`;
        break;
    }

    const ctx = qrPreview?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, qrPreview.width, qrPreview.height);

    if (data && data.trim() !== '') {
      const qrColorValue = qrColor?.value || '#000000';
      const bgColorValue = bgColor?.value || '#FFFFFF';
      const size = parseInt(document.getElementById('size')?.value || '512');

      const tempDiv = document.createElement('div');
      new QRCode(tempDiv, {
        text: data,
        width: size,
        height: size,
        colorDark: qrColorValue,
        colorLight: bgColorValue,
        correctLevel: QRCode.CorrectLevel.H
      });

      setTimeout(() => {
        const img = tempDiv.querySelector('img') || tempDiv.querySelector('canvas');
        if (img) {
          const newCanvas = document.createElement('canvas');
          newCanvas.width = size;
          newCanvas.height = size;
          const newCtx = newCanvas.getContext('2d');
          newCtx.drawImage(img, 0, 0, size, size);

          // Add logo if selected
          const logoInput = document.getElementById('logo-input');
          if (logoInput?.files[0]) {
            const logoReader = new FileReader();
            logoReader.onload = function(e) {
              const logoImg = new Image();
              logoImg.onload = function() {
                const logoSize = size * 0.2;
                const logoX = (size - logoSize) / 2;
                const logoY = (size - logoSize) / 2;
                newCtx.fillStyle = bgColorValue;
                newCtx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
                newCtx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
                
                qrPreview.width = size;
                qrPreview.height = size;
                qrPreview.getContext('2d').drawImage(newCanvas, 0, 0);
                
                if (previewText) {
                  previewText.textContent = 'Pré-visualização do QR Code.';
                }
              };
              logoImg.src = e.target.result;
            };
            logoReader.readAsDataURL(logoInput.files[0]);
          } else {
            qrPreview.width = size;
            qrPreview.height = size;
            qrPreview.getContext('2d').drawImage(newCanvas, 0, 0);
            
            if (previewText) {
              previewText.textContent = 'Pré-visualização do QR Code.';
            }
          }
        } else {
          if (previewText) {
            previewText.textContent = 'Erro ao gerar pré-visualização.';
          }
        }
      }, 200);
    } else {
      if (previewText) {
        previewText.textContent = 'Selecione um tipo e preencha os dados para ver a pré-visualização.';
      }
    }
  }

  // Handle generate click
  generateBtn?.addEventListener('click', handleGenerateClick);

  async function handleGenerateClick() {
    const type = qrTypeSelect?.value;
    if (!type) {
      showMessage('Por favor, selecione um tipo de QR Code.', 'error');
      return;
    }

    let data = {};
    let isValid = true;

    switch (type) {
      case 'url':
        const urlInput = document.getElementById('url-input');
        data.url = urlInput?.value;
        if (!data.url) isValid = false;
        break;
      case 'vcard':
        const name = document.getElementById('name')?.value;
        data = {
          name: name || '',
          company: document.getElementById('company')?.value || '',
          position: document.getElementById('position')?.value || '',
          phone: document.getElementById('phone')?.value || '',
          email: document.getElementById('email')?.value || '',
          website: document.getElementById('website')?.value || '',
          address: document.getElementById('address')?.value || '',
          photoUrl: vcardPhotoUrl || null,
          avatar: vcardAvatar || null
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
        const textInput = document.getElementById('text-input');
        data.text = textInput?.value;
        if (!data.text) isValid = false;
        break;
      case 'wifi':
        const ssid = document.getElementById('ssid')?.value;
        data = {
          ssid: ssid || '',
          password: document.getElementById('password')?.value || '',
          security: document.getElementById('security')?.value || 'nopass'
        };
        if (!data.ssid) isValid = false;
        break;
    }

    if (!isValid) {
      showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    const options = {
      color: qrColor?.value || '#000000',
      bgColor: bgColor?.value || '#FFFFFF',
      size: parseInt(document.getElementById('size')?.value || '512')
    };

    const logoInput = document.getElementById('logo-input');
    if (logoInput?.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        options.logo = e.target.result;
        generateQR(type, data, options);
      };
      reader.readAsDataURL(logoInput.files[0]);
    } else {
      generateQR(type, data, options);
    }
  }

  // Generate QR Code
  async function generateQR(type, data, options) {
    if (!generateBtn) return;

    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span>⏳ Gerando...</span>';

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar QR Code.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${type}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showMessage('QR Code gerado e baixado com sucesso!', 'success');
      updatePreview();
    } catch (err) {
      console.error('Erro ao gerar QR Code:', err);
      showMessage(err.message || 'Erro ao gerar QR Code.', 'error');
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<span>✨ Gerar e Baixar QR Code</span>';
    }
  }

  // Load creations
  async function loadCreations() {
    try {
      const response = await fetch('/api/creations');
      const data = await response.json();

      if (response.ok) {
        displayCreations(data.creations);
      } else {
        showCreationsMessage(data.error || 'Erro ao carregar criações', 'error');
      }
    } catch (error) {
      console.error('Erro ao carregar criações:', error);
      showCreationsMessage('Erro ao carregar criações', 'error');
    }
  }

  // Display creations
  function displayCreations(creations) {
    const creationsList = document.getElementById('creations-list');
    if (!creationsList) return;

    creationsList.innerHTML = '';

    if (creations.length === 0) {
      creationsList.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">Você ainda não criou nenhum QR Code.</p>';
      return;
    }

    creations.forEach(creation => {
      const creationDiv = document.createElement('div');
      creationDiv.className = 'creation-item';
      creationDiv.innerHTML = `
        <div class="creation-info">
          <h3>${creation.type.toUpperCase()}</h3>
          <p>Criado em: ${new Date(creation.created_at).toLocaleString('pt-BR')}</p>
        </div>
        <button class="download-btn" data-id="${creation.id}">📥 Baixar</button>
      `;
      creationsList.appendChild(creationDiv);
    });

    // Add event listeners for download buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        downloadCreation(id);
      });
    });
  }

  // Download creation
  async function downloadCreation(id) {
    try {
      const response = await fetch(`/api/creations/${id}/download`);
      if (!response.ok) throw new Error('Erro ao baixar QR');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showCreationsMessage('QR Code baixado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao baixar QR:', error);
      showCreationsMessage('Erro ao baixar QR Code', 'error');
    }
  }

  // Show message
  function showMessage(text, type) {
    if (!messageDiv) return;
    messageDiv.textContent = text;
    messageDiv.className = `message show ${type}`;
    setTimeout(() => {
      messageDiv.textContent = '';
      messageDiv.className = 'message';
    }, 5000);
  }

  // Show creations message
  function showCreationsMessage(text, type) {
    const creationsMessage = document.getElementById('creations-message');
    if (!creationsMessage) return;
    creationsMessage.textContent = text;
    creationsMessage.className = `message show ${type}`;
    setTimeout(() => {
      creationsMessage.textContent = '';
      creationsMessage.className = 'message';
    }, 5000);
  }

  // Initialize form and show generator tab
  if (qrTypeSelect) {
    showForm(qrTypeSelect.value);
    updatePreview();
  }

  // Ensure generator tab is shown initially
  const generatorTab = document.getElementById('generator-tab');
  if (generatorTab && !generatorTab.classList.contains('active')) {
    switchTab('generator');
  }
});
