import { createInput } from '../ui/Input.js';
import { createButton } from '../ui/Button.js';

export function createLoginPage(navigateTo) {
    const container = document.createElement('div');
    container.className = 'flex min-h-full flex-col justify-center px-6 py-12 lg:px-8 bg-gray-50';

    container.innerHTML = `
    <div class="sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <h2 class="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">Sign in to your account</h2>
      <p class="mt-2 text-center text-sm text-slate-500">
        Welcome back to ViteChat
      </p>
    </div>

    <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
      <div class="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12 border border-gray-100">
        <form class="space-y-6" action="#" method="POST" id="login-form">
          <div id="email-container"></div>
          <div id="password-container"></div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600">
              <label for="remember-me" class="ml-2 block text-sm text-slate-900">Remember me</label>
            </div>

            <div class="text-sm">
              <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">Forgot password?</a>
            </div>
          </div>

          <div id="submit-btn-container"></div>
        </form>

        <p class="mt-10 text-center text-sm text-slate-500">
          Not a member?
          <button id="register-link" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500 hover:underline transition-all">Start a 14 day free trial</button>
        </p>
      </div>
    </div>
  `;

    // Mount components
    const emailInput = createInput({
        id: 'email',
        label: 'Email address',
        type: 'email',
        required: true,
        placeholder: 'you@example.com',
        icon: `<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>`
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

    const submitBtn = createButton({
        text: 'Sign in',
        type: 'submit',
        variant: 'primary',
        fullWidth: true
    });
    container.querySelector('#submit-btn-container').appendChild(submitBtn);

    // Logic
    const form = container.querySelector('#login-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        submitBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing in...`;
        submitBtn.disabled = true;

        // Fake authentication delay
        setTimeout(() => {
            navigateTo('chat');
        }, 1500);
    });

    container.querySelector('#register-link').addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('register');
    });

    return container;
}
