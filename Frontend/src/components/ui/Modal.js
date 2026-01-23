import { createButton } from './Button.js';

export function createSuccessModal({ title, message, onConfirm }) {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-[100] bg-gray-900/75 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200 opacity-0';

    const modal = document.createElement('div');
    modal.className = 'bg-white rounded-2xl shadow-xl w-full max-w-sm transform scale-95 transition-all duration-200 overflow-hidden';

    modal.innerHTML = `
        <div class="p-6 text-center">
             <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6 ring-8 ring-green-50">
                <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
             </div>
            <h3 class="text-xl font-bold leading-6 text-gray-900 mb-2">${title}</h3>
            <p class="text-sm text-gray-500 mb-6">
                ${message}
            </p>
            <div id="modal-actions"></div>
        </div>
    `;

    // Append to body immediately to query selector
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Add button
    const actionsContainer = modal.querySelector('#modal-actions');
    const confirmBtn = createButton({
        text: 'Continue to Login',
        variant: 'primary',
        fullWidth: true,
        onClick: () => {
            closeModal();
        }
    });
    actionsContainer.appendChild(confirmBtn);

    // Animation In
    requestAnimationFrame(() => {
        overlay.classList.remove('opacity-0');
        modal.classList.remove('scale-95');
        modal.classList.add('scale-100');
    });

    function closeModal() {
        overlay.classList.add('opacity-0');
        modal.classList.remove('scale-100');
        modal.classList.add('scale-95');

        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
            if (onConfirm) onConfirm();
        }, 200);
    }
}
