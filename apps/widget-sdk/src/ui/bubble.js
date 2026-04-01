/**
 * W-004: Chat Bubble Button
 */

const ICON_CHAT = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
</svg>`;

const ICON_CLOSE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
</svg>`;

export class Bubble {
  constructor(shadow, color, onToggle) {
    this._shadow = shadow;
    this._onToggle = onToggle;
    this._unread = 0;
    this._open = false;
    this._el = null;
    this._badge = null;
    this._render(color);
  }

  _render(color) {
    const btn = document.createElement('button');
    btn.className = 'w-bubble';
    btn.setAttribute('aria-label', 'Mở chat');
    btn.style.setProperty('--w-color', color);
    btn.innerHTML = `
      <span class="icon-chat">${ICON_CHAT}</span>
      <span class="icon-close">${ICON_CLOSE}</span>
    `;

    const badge = document.createElement('span');
    badge.className = 'w-badge';
    badge.style.display = 'none';
    btn.appendChild(badge);

    btn.addEventListener('click', () => {
      this._onToggle();
    });

    this._shadow.appendChild(btn);
    this._el = btn;
    this._badge = badge;
  }

  setOpen(open) {
    this._open = open;
    this._el.setAttribute('aria-label', open ? 'Đóng chat' : 'Mở chat');
    if (open) {
      this._el.classList.add('w-bubble--open');
      this.clearBadge();
    } else {
      this._el.classList.remove('w-bubble--open');
    }
  }

  addUnread(n = 1) {
    if (!this._open) {
      this._unread += n;
      this._badge.textContent = this._unread > 9 ? '9+' : String(this._unread);
      this._badge.style.display = 'flex';
    }
  }

  clearBadge() {
    this._unread = 0;
    this._badge.style.display = 'none';
  }
}
