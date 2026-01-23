import { createInput } from '../ui/Input.js';
import { createButton } from '../ui/Button.js';

export function createRegisterPage(navigateTo) {
  const container = document.createElement('div');
  container.className = 'flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50';

  container.innerHTML = `
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
      </div>
      <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">Create your account</h2>
      <p class="mt-2 text-center text-sm text-slate-500">
        Get started with your free account today.
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-100">
        <form class="space-y-6" action="#" method="POST" id="register-form">
          <div id="username-container"></div>
          <div id="email-container"></div>
          <div id="password-container"></div>
          <div id="confirm-password-container"></div>

          <div id="error-message" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600"></div>
          <div id="submit-btn-container"></div>
        </form>

        <p class="mt-10 text-center text-sm text-slate-500">
          Already have an account?
          <button id="login-link" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline transition-all">Sign in</button>
        </p>
      </div>
    </div>
  `;

  // Mount components
  const usernameInput = createInput({
    id: 'username',
    label: 'Username',
    placeholder: 'johndoe',
    required: true,
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`
  });
  container.querySelector('#username-container').appendChild(usernameInput);

  const emailInput = createInput({
    id: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'john@example.com',
    required: true,
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`
  });
  container.querySelector('#email-container').appendChild(emailInput);

  const passwordInput = createInput({
    id: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: '••••••••',
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>`
  });
  container.querySelector('#password-container').appendChild(passwordInput);

  const confirmPasswordInput = createInput({
    id: 'confirm-password',
    label: 'Confirm Password',
    type: 'password',
    required: true,
    placeholder: '••••••••',
    icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>`
  });
  container.querySelector('#confirm-password-container').appendChild(confirmPasswordInput);


  const submitBtn = createButton({
    text: 'Create Account',
    type: 'submit',
    variant: 'primary',
    fullWidth: true
  });
  container.querySelector('#submit-btn-container').appendChild(submitBtn);

  // Logic
  const form = container.querySelector('#register-form');
  const errorDiv = container.querySelector('#error-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.classList.add('hidden');

    const username = container.querySelector('#username').value.trim();
    const email = container.querySelector('#email').value.trim();
    const password = container.querySelector('#password').value;
    const confirmPassword = container.querySelector('#confirm-password').value;

    if (password !== confirmPassword) {
      errorDiv.textContent = 'Passwords do not match';
      errorDiv.classList.remove('hidden');
      return;
    }

    submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating account...`;
    submitBtn.disabled = true;

    try {
      const res = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Registration failed');
      }

      // Success
      import('../ui/Modal.js').then(({ createSuccessModal }) => {
        createSuccessModal({
          title: "Account Created!",
          message: "Your account has been successfully created. You can now log in to start chatting.",
          onConfirm: () => {
            navigateTo('login');
          }
        });
      });

    } catch (err) {
      errorDiv.textContent = err.message;
      errorDiv.classList.remove('hidden');
      submitBtn.innerHTML = 'Create Account';
      submitBtn.disabled = false;
    }
  });

  container.querySelector('#login-link').addEventListener('click', (e) => {
    e.preventDefault();
    navigateTo('login');
  });

  return container;
}
