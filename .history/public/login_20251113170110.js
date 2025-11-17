document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginFormElement = document.getElementById('login-form-element');
  const registerFormElement = document.getElementById('register-form-element');
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const authMessage = document.getElementById('auth-message');
  const toggleLoginPassword = document.getElementById('toggle-login-password');
  const toggleRegisterPassword = document.getElementById('toggle-register-password');
  const registerPassword = document.getElementById('register-password');
  const strengthBar = document.querySelector('.strength-bar');

  // Check URL for form type
  const urlParams = new URLSearchParams(window.location.search);
  const formType = window.location.pathname.includes('register') ? 'register' : 'login';
  showForm(formType);

  // Switch between forms
  switchToRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('register');
    window.history.pushState({}, '', '/register');
  });

  switchToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    showForm('login');
    window.history.pushState({}, '', '/login');
  });

  // Toggle password visibility
  toggleLoginPassword?.addEventListener('click', () => {
    const passwordInput = document.getElementById('login-password');
    togglePasswordVisibility(passwordInput, toggleLoginPassword);
  });

  toggleRegisterPassword?.addEventListener('click', () => {
    togglePasswordVisibility(registerPassword, toggleRegisterPassword);
  });

  // Password strength indicator
  registerPassword?.addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
  });

  // Form submissions
  loginFormElement?.addEventListener('submit', handleLogin);
  registerFormElement?.addEventListener('submit', handleRegister);

  // Functions
  function showForm(type) {
    if (type === 'register') {
      loginForm?.classList.remove('active');
      registerForm?.classList.add('active');
    } else {
      registerForm?.classList.remove('active');
      loginForm?.classList.add('active');
    }
    hideMessage();
  }

  function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈';
    } else {
      input.type = 'password';
      button.textContent = '👁️';
    }
  }

  function updatePasswordStrength(password) {
    if (!strengthBar) return;

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    strengthBar.className = 'strength-bar';
    if (strength <= 2) {
      strengthBar.classList.add('weak');
    } else if (strength <= 3) {
      strengthBar.classList.add('medium');
    } else {
      strengthBar.classList.add('strong');
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const button = e.target.querySelector('button[type="submit"]');

    if (!username || !password) {
      showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    // Disable button and show loading
    button.disabled = true;
    button.classList.add('loading');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Login realizado com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        showMessage(data.error || 'Erro ao fazer login. Verifique suas credenciais.', 'error');
        button.disabled = false;
        button.classList.remove('loading');
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      showMessage('Erro ao conectar ao servidor. Tente novamente.', 'error');
      button.disabled = false;
      button.classList.remove('loading');
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const button = e.target.querySelector('button[type="submit"]');

    // Validation
    if (!email || !name || !username || !password) {
      showMessage('Por favor, preencha todos os campos.', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    if (!email.includes('@')) {
      showMessage('Por favor, insira um email válido.', 'error');
      return;
    }

    // Disable button and show loading
    button.disabled = true;
    button.classList.add('loading');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, username, password })
      });

      const data = await response.json();

      if (response.ok) {
        showMessage('Conta criada com sucesso! Redirecionando...', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        showMessage(data.error || 'Erro ao criar conta. Tente novamente.', 'error');
        button.disabled = false;
        button.classList.remove('loading');
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      showMessage('Erro ao conectar ao servidor. Tente novamente.', 'error');
      button.disabled = false;
      button.classList.remove('loading');
    }
  }

  function showMessage(text, type) {
    if (!authMessage) return;
    authMessage.textContent = text;
    authMessage.className = `auth-message show ${type}`;
    authMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideMessage() {
    if (!authMessage) return;
    authMessage.textContent = '';
    authMessage.className = 'auth-message';
  }

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const formType = window.location.pathname.includes('register') ? 'register' : 'login';
    showForm(formType);
  });
});

