export function createButton({ text, type = 'button', variant = 'primary', fullWidth = false, onClick }) {
    const btn = document.createElement('button');
    btn.type = type;
    btn.textContent = text;

    const baseClasses = 'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm hover:shadow',
        secondary: 'bg-white text-slate-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm',
        ghost: 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 focus:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm'
    };

    btn.className = `${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`;

    if (onClick) {
        btn.addEventListener('click', onClick);
    }

    return btn;
}
