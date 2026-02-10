// Toast notification utility
class ToastManager {
  constructor() {
    this.toasts = [];
    this.toastId = 0;
  }

  show(message, type = 'info', duration = 3000) {
    const id = this.toastId++;
    const toast = { id, message, type, duration };
    
    // Create and show toast element
    this.createToastElement(toast);
    
    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
    
    return id;
  }

  success(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  error(message, duration = 3000) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration = 3000) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  loading(message) {
    return this.show(message, 'loading', 0); // No auto dismiss
  }

  dismiss(id) {
    const toastElement = document.getElementById(`toast-${id}`);
    if (toastElement) {
      toastElement.remove();
    }
  }

  createToastElement(toast) {
    // Create container if not exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
      document.body.appendChild(container);
    }

    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.id = `toast-${toast.id}`;
    
    // Set styles based on type
    let bgColor = 'bg-blue-500';
    let icon = 'ℹ️';
    
    switch(toast.type) {
      case 'success':
        bgColor = 'bg-green-500';
        icon = '✓';
        break;
      case 'error':
        bgColor = 'bg-red-500';
        icon = '✕';
        break;
      case 'warning':
        bgColor = 'bg-yellow-500';
        icon = '⚠';
        break;
      case 'loading':
        bgColor = 'bg-blue-500';
        icon = '⟳';
        break;
    }

    toastEl.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg animate-slide-in flex items-center gap-2`;
    toastEl.innerHTML = `<span>${icon}</span><span>${toast.message}</span>`;
    
    container.appendChild(toastEl);

    // Add animation
    const style = document.createElement('style');
    if (!document.getElementById('toast-styles')) {
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export const showToast = new ToastManager();
