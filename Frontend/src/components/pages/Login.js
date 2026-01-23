import { createInput } from '../ui/Input.js';
import { createButton } from '../ui/Button.js';

export function createLoginPage(handleLogin) {
  const container = document.createElement('div');
  container.className = 'flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50';

  container.innerHTML = `
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in to HacMieu Chat</h2>
      <p class="mt-2 text-center text-sm text-slate-500">
        Enter your credentials to continue
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-100">
        <form class="space-y-6" action="#" method="POST" id="login-form">
          <div id="username-container"></div>
          <div id="password-container"></div>

          <div id="submit-btn-container"></div>
          
          <div id="error-message" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"></div>
        </form>

        <p class="mt-10 text-center text-sm text-slate-500">
          Don't have an account? 
          <a href="#" id="register-link" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline">Register now</a>
        </p>
      </div>
    </div>
  `;

  // Mount components
  const usernameInput = createInput({
    id: 'username',
    label: 'Username',
    type: 'text',
    required: true,
    placeholder: 'your_username',
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`
  });
  container.querySelector('#username-container').appendChild(usernameInput);

  const passwordInput = createInput({
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: '••••••••',
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`
  });
  container.querySelector('#password-container').appendChild(passwordInput);

  const submitBtn = createButton({
    text: 'Sign in',
    type: 'submit',
    variant: 'primary',
    fullWidth: true
  });
  container.querySelector('#submit-btn-container').appendChild(submitBtn);

  // Logic
  const form = container.querySelector('#login-form');
  const errorDiv = container.querySelector('#error-message');

  // Register link handler - Dispatch event used in main.js
  const registerLink = container.querySelector('#register-link');
  registerLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Since createLoginPage takes handleLogin, we might need a way to navigate to register.
    // It seems main.js Logic for Login page doesn't explicitly pass navigateTo.
    // But main.js handles state. We can dispatch a custom event.
    document.dispatchEvent(new CustomEvent('navigate', { detail: 'register' }));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = container.querySelector('#username').value.trim();
    const password = container.querySelector('#password').value;

    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    // Show loading
    submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Connecting...`;
    submitBtn.disabled = true;
    errorDiv.classList.add('hidden');

    try {
      // Call API
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Save Token
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user_id', data.user_id);
      localStorage.setItem('username', data.username);

      await handleLogin(data.user_id, data.username, data.access_token);
    } catch (error) {
      showError(error.message || 'Login failed. Please try again.');
      submitBtn.innerHTML = 'Sign in';
      submitBtn.disabled = false;
    }
  });

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
  }

  return container;
}
