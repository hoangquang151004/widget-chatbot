/**
 * W-010: Widget — Điều phối toàn bộ state và luồng nghiệp vụ.
 */

import { Bubble } from './ui/bubble.js';
import { ChatWindow } from './ui/window.js';
import { Messages } from './ui/messages.js';
import { sendMessage, streamMessage } from './api/client.js';
import { getSessionId, clearSession } from './storage/session.js';
import widgetCss from './styles/widget.css?inline';
import { t } from './i18n.js';

export class Widget {
  constructor(config, shadow) {
    this._config = config;
    this._shadow = shadow;
    this._isOpen = false;
    this._isStreaming = false;
    this._sessionId = getSessionId(config.publicKey);

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = widgetCss;
    // Set CSS vars for primary color and font size
    style.textContent += `:host { --w-color: ${config.color}; --w-font-size: ${config.fontSize || '14px'}; }`;
    shadow.appendChild(style);

    // Expose shadow reference for bar chart canvas queries
    document._xenoWidgetShadow = shadow;
    document._xenoWidgetLocale = config.locale || 'vi';

    // Init UI
    this._bubble = new Bubble(shadow, config.color, () => this.toggle());
    this._chatWindow = new ChatWindow(
      shadow, config,
      (text) => this._handleSend(text),
      () => this.close(),
      () => this._handleReset(),
    );
    this._messages = new Messages(this._chatWindow.messagesEl, config);

    // Welcome message
    this._messages.appendWelcome();
    this._messages.appendResetButton(() => this._handleReset());
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  open() {
    this._isOpen = true;
    this._chatWindow.open();
    this._bubble.setOpen(true);
  }

  close() {
    this._isOpen = false;
    this._chatWindow.close();
    this._bubble.setOpen(false);
  }

  async _handleSend(text) {
    if (this._isStreaming) return;

    this._messages.appendUser(text);
    this._isStreaming = true;
    this._chatWindow.setDisabled(true);

    const useStream = !!this._config.stream;

    try {
      if (useStream) {
        // W-008: SSE Streaming
        this._messages.startStream();
        await streamMessage(
          this._config,
          text,
          this._sessionId,
          (chunk) => this._messages.appendChunk(chunk),
          (payload) => {
            this._messages.endStream(payload);
            this._bubble.addUnread();
          }
        );
      } else {
        // W-007: Normal POST
        this._messages.showTyping();
        const data = await sendMessage(this._config, text, this._sessionId);
        this._messages.appendBot(data.content || '…', data.component, data.citations);
        if (!this._isOpen) this._bubble.addUnread();
      }
    } catch (err) {
      this._messages.hideTyping();
      this._messages.endStream();
      const msg = err.name === 'AbortError'
        ? t(this._config.locale, 'timeoutMessage')
        : (err.message || t(this._config.locale, 'connectError'));
      this._messages.appendError(msg);
    } finally {
      this._isStreaming = false;
      this._chatWindow.setDisabled(false);
    }
  }

  _handleReset() {
    clearSession(this._config.publicKey);
    this._sessionId = getSessionId(this._config.publicKey);
    this._messages.clear();
    this._messages.appendWelcome();
    this._messages.appendResetButton(() => this._handleReset());
    this._bubble.clearBadge();
  }
}
