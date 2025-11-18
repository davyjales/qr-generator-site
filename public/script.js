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
    console.log('Mudando para aba:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.remove('active');
      tab.classList.add('hidden');
    });
    
    // Remove active from all buttons
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.classList.remove('hidden');
      selectedTab.classList.add('active');
      console.log('Aba selecionada:', selectedTab.id);
    } else {
      console.error('Aba não encontrada:', `${tabName}-tab`);
    }
    
    // Activate button
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }

    if (tabName === 'creations') {
      console.log('Carregando criações...');
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
    const creationsList = document.getElementById('creations-list');
    const creationsMessage = document.getElementById('creations-message');
    
    if (!creationsList) {
      console.error('Elemento creations-list não encontrado!');
      return;
    }

    // Mostrar loading
    creationsList.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">Carregando criações...</p>';
    
    try {
      const response = await fetch('/api/creations', {
        credentials: 'include' // Importante para incluir cookies de sessão
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.creations) {
        console.error('Resposta inválida:', data);
        showCreationsMessage('Resposta inválida do servidor', 'error');
        creationsList.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">Erro ao carregar criações.</p>';
        return;
      }

      console.log('Criações carregadas:', data.creations.length);
      displayCreations(data.creations);
    } catch (error) {
      console.error('Erro ao carregar criações:', error);
      showCreationsMessage(error.message || 'Erro ao carregar criações', 'error');
      creationsList.innerHTML = `<p style="text-align: center; padding: 3rem; color: var(--error-color);">Erro: ${error.message || 'Erro ao carregar criações'}</p>`;
    }
  }

  // Display creations
  function displayCreations(creations) {
    const creationsList = document.getElementById('creations-list');
    if (!creationsList) {
      console.error('Elemento creations-list não encontrado em displayCreations!');
      return;
    }

    creationsList.innerHTML = '';

    if (!creations || creations.length === 0) {
      creationsList.innerHTML = '<p style="text-align: center; padding: 3rem; color: var(--text-secondary);">Você ainda não criou nenhum QR Code.</p>';
      return;
    }

    console.log(`Exibindo ${creations.length} criações`);

    creations.forEach((creation, index) => {
      try {
        const creationDiv = document.createElement('div');
        creationDiv.className = 'creation-item';
        
        // Garantir que os dados existam
        if (!creation.data) creation.data = {};
        if (!creation.options) creation.options = {};
        
        // Gerar informações baseado no tipo
        let infoHtml = '';
        let previewHtml = '';
        
        switch(creation.type) {
        case 'url':
          const urlValue = creation.data.url || creation.data || 'N/A';
          infoHtml = `
            <div class="creation-detail">
              <span class="detail-label">URL:</span>
              <span class="detail-value">
                <a href="${escapeHtml(urlValue)}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-light); text-decoration: underline; word-break: break-all;">
                  ${escapeHtml(urlValue)}
                </a>
              </span>
            </div>
          `;
          break;
        case 'vcard':
          const vcardData = creation.data;
          infoHtml = `
            <div class="creation-detail">
              <span class="detail-label">Nome:</span>
              <span class="detail-value">${escapeHtml(vcardData.name) || 'N/A'}</span>
            </div>
            ${vcardData.company ? `
            <div class="creation-detail">
              <span class="detail-label">Empresa:</span>
              <span class="detail-value">${escapeHtml(vcardData.company)}</span>
            </div>
            ` : ''}
            ${vcardData.position ? `
            <div class="creation-detail">
              <span class="detail-label">Cargo:</span>
              <span class="detail-value">${escapeHtml(vcardData.position)}</span>
            </div>
            ` : ''}
            ${vcardData.phone ? `
            <div class="creation-detail">
              <span class="detail-label">Telefone:</span>
              <span class="detail-value">${escapeHtml(vcardData.phone)}</span>
            </div>
            ` : ''}
            ${vcardData.email ? `
            <div class="creation-detail">
              <span class="detail-label">E-mail:</span>
              <span class="detail-value">${escapeHtml(vcardData.email)}</span>
            </div>
            ` : ''}
            ${vcardData.website ? `
            <div class="creation-detail">
              <span class="detail-label">Website:</span>
              <span class="detail-value">${escapeHtml(vcardData.website)}</span>
            </div>
            ` : ''}
          `;
          
          // Pré-visualização do vCard
          const photoUrl = creation.photo_url || null;
          const avatar = vcardData.avatar || null;
          const displayInitial = (vcardData.name || 'U').charAt(0).toUpperCase();
          const escapedName = escapeHtml(vcardData.name || '');
          
          previewHtml = `
            <div class="vcard-preview">
              <div class="vcard-preview-header">
                <div class="vcard-preview-photo">
                  ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="${escapedName}" onerror="this.style.display='none'; this.parentElement.innerHTML='<span>${escapeHtml(avatar || displayInitial)}</span>'; this.parentElement.style.display='flex';">` : `<span>${escapeHtml(avatar || displayInitial)}</span>`}
                </div>
                <div class="vcard-preview-info">
                  <div class="vcard-preview-name">${escapedName || 'Nome'}</div>
                  ${vcardData.position ? `<div class="vcard-preview-position">${escapeHtml(vcardData.position)}</div>` : ''}
                  ${vcardData.company ? `<div class="vcard-preview-company">${escapeHtml(vcardData.company)}</div>` : ''}
                </div>
              </div>
            </div>
          `;
          break;
        case 'file':
          infoHtml = `
            <div class="creation-detail">
              <span class="detail-label">Arquivo ID:</span>
              <span class="detail-value">${escapeHtml(creation.data.fileId) || 'N/A'}</span>
            </div>
          `;
          break;
        case 'text':
          const textPreview = (creation.data.text || '').substring(0, 100);
          infoHtml = `
            <div class="creation-detail">
              <span class="detail-label">Texto:</span>
              <span class="detail-value">${escapeHtml(textPreview)}${(creation.data.text || '').length > 100 ? '...' : ''}</span>
            </div>
          `;
          break;
        case 'wifi':
          infoHtml = `
            <div class="creation-detail">
              <span class="detail-label">SSID:</span>
              <span class="detail-value">${escapeHtml(creation.data.ssid) || 'N/A'}</span>
            </div>
            <div class="creation-detail">
              <span class="detail-label">Segurança:</span>
              <span class="detail-value">${escapeHtml(creation.data.security) || 'N/A'}</span>
            </div>
          `;
          break;
      }
      
      creationDiv.innerHTML = `
        <div class="creation-header">
          <div class="creation-qr-image">
            <img src="/api/creations/${creation.id}/image" alt="QR Code" loading="lazy">
          </div>
          <div class="creation-meta">
            <h3 class="creation-type">${getTypeLabel(creation.type)}</h3>
            <p class="creation-date">Criado em: ${new Date(creation.created_at).toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div class="creation-content">
          ${previewHtml}
          <div class="creation-info">
            ${infoHtml}
          </div>
        </div>
        <div class="creation-actions">
          ${creation.type === 'vcard' && creation.vcardUrl ? `
            <a href="${creation.vcardUrl}" target="_blank" class="view-btn">
              👁️ Visualizar Página
            </a>
          ` : ''}
          <button class="edit-btn" data-id="${creation.id}">✏️ Editar</button>
          <button class="delete-btn" data-id="${creation.id}">🗑️ Excluir</button>
          <button class="download-btn" data-id="${creation.id}">📥 Baixar</button>
        </div>
      `;
        creationsList.appendChild(creationDiv);
      } catch (error) {
        console.error(`Erro ao exibir criação ${creation.id || index}:`, error);
        // Adicionar um card de erro para esta criação
        const errorDiv = document.createElement('div');
        errorDiv.className = 'creation-item';
        errorDiv.innerHTML = `
          <div class="creation-header">
            <div class="creation-meta">
              <h3 class="creation-type">ERRO</h3>
              <p class="creation-date">Erro ao carregar esta criação</p>
            </div>
          </div>
        `;
        creationsList.appendChild(errorDiv);
      }
    });

    // Add event listeners for buttons
    document.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        downloadCreation(id);
      });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        editCreation(id);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        if (confirm('Tem certeza que deseja excluir este QR Code?')) {
          deleteCreation(id);
        }
      });
    });
  }

  // Helper function to get type label
  function getTypeLabel(type) {
    const labels = {
      'url': 'URL',
      'vcard': 'vCard Profissional',
      'file': 'Arquivo',
      'text': 'Texto',
      'wifi': 'Wi-Fi'
    };
    return labels[type] || type.toUpperCase();
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Delete creation
  async function deleteCreation(id) {
    try {
      const response = await fetch(`/api/creations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao excluir QR Code');
      }

      showCreationsMessage('QR Code excluído com sucesso!', 'success');
      loadCreations(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir QR:', error);
      showCreationsMessage(error.message || 'Erro ao excluir QR Code', 'error');
    }
  }

  // Edit creation
  async function editCreation(id) {
    try {
      const response = await fetch(`/api/creations/${id}/edit`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar QR Code');
      }

      const creation = await response.json();
      openEditModal(creation);
    } catch (error) {
      console.error('Erro ao carregar QR para edição:', error);
      showCreationsMessage(error.message || 'Erro ao carregar QR Code', 'error');
    }
  }

  // Open edit modal
  function openEditModal(creation) {
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.id = 'edit-modal';
    
    let formHtml = '';
    
    // Gerar formulário baseado no tipo
    switch(creation.type) {
      case 'url':
        formHtml = `
          <div class="form-group">
            <label for="edit-url">URL:</label>
            <input type="url" id="edit-url" value="${escapeHtml(creation.data.url || '')}" required>
          </div>
        `;
        break;
      case 'vcard':
        const currentPhotoUrl = creation.photo_url || null;
        const currentAvatar = creation.data.avatar || null;
        const currentInitial = (creation.data.name || 'U').charAt(0).toUpperCase();
        
        // Gerar grid de avatares
        const avatars = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🔬', '👩‍🔬', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🏫', '👩‍🏫', '👨‍⚕️', '👩‍⚕️'];
        let avatarGridHtml = '<div class="avatar-grid" id="edit-avatar-grid">';
        avatars.forEach(avatar => {
          const isSelected = currentAvatar === avatar && !currentPhotoUrl;
          avatarGridHtml += `<div class="avatar-option ${isSelected ? 'selected' : ''}" data-avatar="${avatar}">${avatar}</div>`;
        });
        avatarGridHtml += '</div>';
        
        formHtml = `
          <div class="form-group">
            <label for="edit-name">Nome *:</label>
            <input type="text" id="edit-name" value="${escapeHtml(creation.data.name || '')}" required>
          </div>
          <div class="form-group">
            <label for="edit-company">Empresa:</label>
            <input type="text" id="edit-company" value="${escapeHtml(creation.data.company || '')}">
          </div>
          <div class="form-group">
            <label for="edit-position">Cargo:</label>
            <input type="text" id="edit-position" value="${escapeHtml(creation.data.position || '')}">
          </div>
          <div class="form-group">
            <label for="edit-phone">Telefone:</label>
            <input type="tel" id="edit-phone" value="${escapeHtml(creation.data.phone || '')}">
          </div>
          <div class="form-group">
            <label for="edit-email">E-mail:</label>
            <input type="email" id="edit-email" value="${escapeHtml(creation.data.email || '')}">
          </div>
          <div class="form-group">
            <label for="edit-website">Website:</label>
            <input type="url" id="edit-website" value="${escapeHtml(creation.data.website || '')}">
          </div>
          <div class="form-group">
            <label for="edit-address">Sobre mim:</label>
            <textarea id="edit-address" rows="3">${escapeHtml(creation.data.address || '')}</textarea>
          </div>
          <div class="form-group">
            <label>Foto de Perfil</label>
            <div class="profile-photo-section">
              <div class="profile-photo-preview" id="edit-profile-photo-preview">
                <div class="avatar-placeholder" id="edit-avatar-placeholder" style="display: ${currentPhotoUrl ? 'none' : 'flex'};">
                  <span>${currentAvatar || currentInitial}</span>
                </div>
                <img id="edit-profile-photo-img" src="${currentPhotoUrl || ''}" style="display: ${currentPhotoUrl ? 'block' : 'none'};" alt="Foto de perfil">
              </div>
              <div class="profile-photo-options">
                <div class="file-upload-wrapper">
                  <input type="file" id="edit-vcard-photo-input" accept="image/*">
                  <label for="edit-vcard-photo-input" class="file-upload-label">
                    <span class="file-icon">📷</span>
                    <span class="file-text">Upload de Foto</span>
                  </label>
                </div>
                <div class="avatar-selector">
                  <label>Ou escolha um avatar:</label>
                  ${avatarGridHtml}
                </div>
                <button type="button" id="edit-remove-photo-btn" style="display: ${currentPhotoUrl ? 'block' : 'none'};" class="cancel-btn" style="margin-top: 0.5rem;">Remover Foto</button>
              </div>
            </div>
          </div>
        `;
        break;
      case 'text':
        formHtml = `
          <div class="form-group">
            <label for="edit-text">Texto *:</label>
            <textarea id="edit-text" rows="5" required>${escapeHtml(creation.data.text || '')}</textarea>
          </div>
        `;
        break;
      case 'wifi':
        formHtml = `
          <div class="form-group">
            <label for="edit-ssid">SSID *:</label>
            <input type="text" id="edit-ssid" value="${escapeHtml(creation.data.ssid || '')}" required>
          </div>
          <div class="form-group">
            <label for="edit-password">Senha:</label>
            <input type="text" id="edit-password" value="${escapeHtml(creation.data.password || '')}">
          </div>
          <div class="form-group">
            <label for="edit-security">Segurança:</label>
            <select id="edit-security">
              <option value="nopass" ${creation.data.security === 'nopass' ? 'selected' : ''}>Sem senha</option>
              <option value="WPA" ${creation.data.security === 'WPA' ? 'selected' : ''}>WPA</option>
              <option value="WPA2" ${creation.data.security === 'WPA2' ? 'selected' : ''}>WPA2</option>
              <option value="WEP" ${creation.data.security === 'WEP' ? 'selected' : ''}>WEP</option>
            </select>
          </div>
        `;
        break;
    }

    modal.innerHTML = `
      <div class="edit-modal-content">
        <div class="edit-modal-header">
          <h2>Editar QR Code - ${getTypeLabel(creation.type)}</h2>
          <button class="close-modal-btn" onclick="this.closest('.edit-modal').remove()">×</button>
        </div>
        <div class="edit-modal-body">
          <form id="edit-form">
            ${formHtml}
            <div class="form-group">
              <label for="edit-color">Cor do QR Code:</label>
              <input type="color" id="edit-color" value="${creation.options.color || '#000000'}">
            </div>
            <div class="form-group">
              <label for="edit-bg-color">Cor de Fundo:</label>
              <input type="color" id="edit-bg-color" value="${creation.options.bgColor || '#FFFFFF'}">
            </div>
            <div class="form-group">
              <label for="edit-size">Tamanho:</label>
              <input type="number" id="edit-size" value="${creation.options.size || 512}" min="100" max="1000" step="50">
            </div>
          </form>
        </div>
        <div class="edit-modal-footer">
          <button class="cancel-btn" onclick="this.closest('.edit-modal').remove()">Cancelar</button>
          <button class="save-btn" onclick="saveEdit(${creation.id}, '${creation.type}')">Salvar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup para vCard: avatar e foto
    if (creation.type === 'vcard') {
      let editVcardPhotoUrl = creation.photo_url || null;
      let editVcardAvatar = creation.data.avatar || null;
      
      // Avatar selector
      const avatarGrid = document.getElementById('edit-avatar-grid');
      if (avatarGrid) {
        avatarGrid.querySelectorAll('.avatar-option').forEach(option => {
          option.addEventListener('click', function() {
            avatarGrid.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            editVcardAvatar = this.dataset.avatar;
            editVcardPhotoUrl = null;
            updateEditVCardPhotoPreview();
          });
        });
      }
      
      // Photo upload
      const editPhotoInput = document.getElementById('edit-vcard-photo-input');
      if (editPhotoInput) {
        editPhotoInput.addEventListener('change', async function(e) {
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
              editVcardPhotoUrl = result.photoUrl;
              editVcardAvatar = null;
              if (avatarGrid) {
                avatarGrid.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
              }
              updateEditVCardPhotoPreview();
            } else {
              alert(result.error || 'Erro ao enviar foto.');
            }
          } catch (error) {
            console.error('Erro ao enviar foto:', error);
            alert('Erro ao enviar foto.');
          }
        });
      }
      
      // Remove photo button
      const removePhotoBtn = document.getElementById('edit-remove-photo-btn');
      if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', function() {
          editVcardPhotoUrl = null;
          editVcardAvatar = null;
          if (avatarGrid) {
            avatarGrid.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
          }
          updateEditVCardPhotoPreview();
        });
      }
      
      // Update preview function
      function updateEditVCardPhotoPreview() {
        const preview = document.getElementById('edit-profile-photo-preview');
        const avatarPlaceholder = document.getElementById('edit-avatar-placeholder');
        const photoImg = document.getElementById('edit-profile-photo-img');
        const removeBtn = document.getElementById('edit-remove-photo-btn');
        
        if (!preview || !avatarPlaceholder || !photoImg) return;
        
        if (editVcardPhotoUrl) {
          photoImg.src = editVcardPhotoUrl;
          photoImg.style.display = 'block';
          avatarPlaceholder.style.display = 'none';
          if (removeBtn) removeBtn.style.display = 'block';
        } else if (editVcardAvatar) {
          avatarPlaceholder.innerHTML = `<span>${editVcardAvatar}</span>`;
          avatarPlaceholder.style.display = 'flex';
          photoImg.style.display = 'none';
          if (removeBtn) removeBtn.style.display = 'none';
        } else {
          const nameInput = document.getElementById('edit-name');
          const name = nameInput?.value || '';
          const initial = name ? name.charAt(0).toUpperCase() : '👤';
          avatarPlaceholder.innerHTML = `<span>${initial}</span>`;
          avatarPlaceholder.style.display = 'flex';
          photoImg.style.display = 'none';
          if (removeBtn) removeBtn.style.display = 'none';
        }
        
        // Update modal dataset
        if (modal) {
          modal.dataset.editPhotoUrl = editVcardPhotoUrl || '';
          modal.dataset.editAvatar = editVcardAvatar || '';
        }
      }
      
      // Update when name changes
      const nameInput = document.getElementById('edit-name');
      if (nameInput) {
        nameInput.addEventListener('input', updateEditVCardPhotoPreview);
      }
      
      // Initial update
      updateEditVCardPhotoPreview();
    }
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Save edit
  window.saveEdit = async function(id, type) {
    try {
      let data = {};
      let isValid = true;

      switch(type) {
        case 'url':
          const url = document.getElementById('edit-url').value;
          if (!url) isValid = false;
          data.url = url;
          break;
        case 'vcard':
          const name = document.getElementById('edit-name').value;
          if (!name) isValid = false;
          
          // Obter foto/avatar do modal
          const modal = document.getElementById('edit-modal');
          const editPhotoUrl = modal?.dataset.editPhotoUrl || null;
          const editAvatar = modal?.dataset.editAvatar || null;
          
          data = {
            name: name,
            company: document.getElementById('edit-company').value || '',
            position: document.getElementById('edit-position').value || '',
            phone: document.getElementById('edit-phone').value || '',
            email: document.getElementById('edit-email').value || '',
            website: document.getElementById('edit-website').value || '',
            address: document.getElementById('edit-address').value || '',
            photoUrl: editPhotoUrl,
            avatar: editAvatar
          };
          break;
        case 'text':
          const text = document.getElementById('edit-text').value;
          if (!text) isValid = false;
          data.text = text;
          break;
        case 'wifi':
          const ssid = document.getElementById('edit-ssid').value;
          if (!ssid) isValid = false;
          data = {
            ssid: ssid,
            password: document.getElementById('edit-password').value || '',
            security: document.getElementById('edit-security').value || 'nopass'
          };
          break;
      }

      if (!isValid) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      const options = {
        color: document.getElementById('edit-color').value,
        bgColor: document.getElementById('edit-bg-color').value,
        size: parseInt(document.getElementById('edit-size').value)
      };

      const response = await fetch(`/api/creations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, data, options })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar QR Code');
      }

      document.getElementById('edit-modal').remove();
      showCreationsMessage('QR Code atualizado com sucesso!', 'success');
      loadCreations(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert(error.message || 'Erro ao atualizar QR Code');
    }
  };

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
  const creationsTab = document.getElementById('creations-tab');
  
  if (generatorTab && !generatorTab.classList.contains('active')) {
    switchTab('generator');
  }
  
  // Verificar se a aba de criações está visível (caso o usuário recarregue a página nela)
  if (creationsTab && creationsTab.classList.contains('active')) {
    console.log('Aba de criações já está ativa, carregando...');
    loadCreations();
  }
  
  console.log('Script inicializado. Generator tab:', generatorTab?.classList.contains('active'), 'Creations tab:', creationsTab?.classList.contains('active'));
});
