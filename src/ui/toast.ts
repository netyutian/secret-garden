export function showToast(message: string): void {
  let container = document.querySelector('.toast-container') as HTMLElement;
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
    if (container && container.children.length === 0) {
      container.remove();
    }
  }, 2500);
}
