export function createInput({
    type = 'text',
    id,
    label,
    placeholder,
    required = false,
    icon = null
}) {
    const container = document.createElement('div');
    container.className = 'space-y-1.5';

    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.className = 'block text-sm font-medium text-slate-700';
    labelEl.textContent = label;
    if (required) {
        const star = document.createElement('span');
        star.className = 'text-red-500 ml-0.5';
        star.textContent = '*';
        labelEl.appendChild(star);
    }

    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'relative';

    const input = document.createElement('input');
    input.type = type;
    input.id = id;
    input.name = id;
    input.placeholder = placeholder;
    input.required = required;
    input.className = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors shadow-sm';

    if (icon) {
        input.classList.add('pl-10');
        const iconWrapper = document.createElement('div');
        iconWrapper.className = 'pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400';
        iconWrapper.innerHTML = icon;
        inputWrapper.appendChild(iconWrapper);
    }

    // Password toggle
    if (type === 'password') {
        input.classList.add('pr-10');
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none';
        toggleBtn.innerHTML = `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;

        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            toggleBtn.innerHTML = isPassword
                ? `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 011.574-2.59M5.375 5.375l13.25 13.25" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.882 9.882a3 3 0 104.243 4.243" /></svg>`
                : `<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>`;
        });
        inputWrapper.appendChild(toggleBtn);
    }

    inputWrapper.prepend(input);
    container.appendChild(labelEl);
    container.appendChild(inputWrapper);

    return container;
}
