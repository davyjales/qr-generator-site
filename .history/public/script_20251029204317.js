document.addEventListener('DOMContentLoaded', function() {
  const qrTypeSelect = document.getElementById('qr-type');
  const qrForm = document.getElementById('qr-form');
  const generateBtn = document.getElementById('generate-btn');
  generateBtn.addEventListener('click', handleGenerateClick);
  const messageDiv = document.getElementById('message');
  const qrPreview = document.getElementById('qr-preview');
  const previewText = document.getElementById('preview-text');

  let currentQR = null;
  let uploadedFileId = null;
  let currentUser = null;

  // Elementos de navegação e auth
  const navBtns = document.querySelectorAll('.nav-btn');
  const loginBtn = document.getElementById('login-btn');
  const registerBtn = document.getElementById('register-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userInfo = document.getElementById('user-info');
  const authModal = document.getElementById('auth-modal');
  const closeModal = document.querySelector('.close');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const loginForm = document.getElementById('login-form-element');
  const registerForm = document.getElementById('register-form-element');

  // Inicializar
  checkAuthStatus();
  setupNavigation();
  setupAuthModal();

  // Funções de autenticação
  async function checkAuthStatus() {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        updateAuthUI(true);
      } else {
        currentUser = null;
        updateAuthUI(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status de auth:', error);
      currentUser = null;
      updateAuthUI(false);
    }
  }

  function updateAuthUI(isLoggedIn) {
    if (isLoggedIn) {
      loginBtn.style.display = 'none';
      registerBtn.style.display = 'none';
      userInfo.textContent = `Olá, ${currentUser.name}`;
      userInfo.style.display = 'inline';
      logoutBtn.style.display = 'inline';
    } else {
      loginBtn.style.display = 'inline';
      registerBtn.style.display = 'inline';
      userInfo.style.display = 'none';
      logoutBtn.style.display = 'none';
    }
  }

  function setupNavigation() {
    navBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const tab = this.dataset.tab;
        if (tab === 'creations' && !currentUser) {
          showMessage('Você precisa estar logado para ver suas criações.', 'error');
          return;
        }
        switchTab(tab);
      });
    });
  }

  function switchTab(tabName) {
    // Esconde todas as abas
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    // Remove active de todos os botões
    navBtns.forEach(btn => btn.classList.remove('active'));
    // Mostra a aba selecionada
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    // Ativa o botão
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    if (tabName === 'creations') {
      loadCreations();
    }
  }

  function setupAuthModal() {
    loginBtn.addEventListener('click', () => showAuthModal('login'));
    registerBtn.addEventListener('click', () => showAuthModal('register'));
    closeModal.addEventListener('click', () => authModal.style.display = 'none');
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm('register');
    });
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      showAuthForm('login');
    });

    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    // Fecha modal ao clicar fora
    window.addEventListener('click', (e) => {
      if (e.target === authModal) {
        authModal.style.display = 'none';
      }
    });
  }

  function showAuthModal(form = 'login') {
    authModal.style.display = 'block';
    showAuthForm(form);
  }

  function showAuthForm(form) {
    document.getElementById('login-form').classList.toggle('hidden', form !== 'login');
    document.getElementById('register-form').classList.toggle('hidden', form !== 'register');
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        currentUser = data.user;
        updateAuthUI(true);
        authModal.style.display = 'none';
        showMessage('Login realizado com sucesso!', 'success');
        // Limpa formulário
        e.target.reset();
      } else {
        showMessage(data.error || 'Erro no login', 'error');
      }
    } catch (error) {
      showMessage('Erro ao fazer login', 'error');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, username, password })
      });

      const data = await response.json();
      if (response.ok) {
        currentUser = data.user;
        updateAuthUI(true);
        authModal.style.display = 'none';
        showMessage('Registro realizado com sucesso!', 'success');
        // Limpa formulário
        e.target.reset();
      } else {
        showMessage(data.error || 'Erro no registro', 'error');
      }
    } catch (error) {
      showMessage('Erro ao registrar', 'error');
    }
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      updateAuthUI(false);
      switchTab('generator');
      showMessage('Logout realizado com sucesso!', 'success');
    } catch (error) {
      showMessage('Erro ao fazer logout', 'error');
    }
  }

  async function loadCreations() {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/creations');
      const data = await response.json();

      if (response.ok) {
        displayCreations(data.creations);
      } else {
        showCreationsMessage(data.error || 'Erro ao carregar criações', 'error');
      }
    } catch (error) {
      showCreationsMessage('Erro ao carregar criações', 'error');
    }
  }

  function displayCreations(creations) {
    const creationsList = document.getElementById('creations-list');
    creationsList.innerHTML = '';
  qrTypeSelect.addEventListener('change', function() {
    const selectedType = this.value;
    showForm(selectedType);
    updatePreview();
  });

  function showForm(type) {
    // Remove required de todos os inputs invisíveis
    document.querySelectorAll('input[required], textarea[required]').forEach(el => el.removeAttribute('required'));

    // Esconde todos os grupos
    document.querySelectorAll('.form-group').forEach(group => group.classList.add('hidden'));

    // Mostra o grupo selecionado
    document.getElementById(`${type}-form`)?.classList.remove('hidden');

    // Define campos obrigatórios conforme o tipo
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

  // Upload de arquivo
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
        data = uploadedFileId ? `http://10.137.174.164:3000/download/${uploadedFileId}` : '';
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

      const tempDiv = document.createElement('div');
      new QRCode(tempDiv, {
        text: data,
        width: size,
        height: size,
        colorDark: qrColor,
        colorLight: bgColor,
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

  // Lógica movida para função separada (usada no submit manual)
  async function handleGenerateClick() {
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
  }

  // Função que gera e baixa o QR Code
  async function generateQR(type, data, options) {
    generateBtn.disabled = true;
    generateBtn.textContent = 'Gerando...';

    try {
      const response = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, options })
      });

      if (!response.ok) throw new Error('Erro ao gerar QR Code.');

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
    } catch (err) {
      showMessage(err.message || 'Erro ao gerar QR Code.', 'error');
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

  // Inicializa o formulário
  showForm(qrTypeSelect.value);
});
