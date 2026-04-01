/**
 * W-009: Session management via localStorage.
 */

const PREFIX = 'ai_widget_session_';

export function getSessionId(publicKey) {
  const key = PREFIX + publicKey;
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : _uuid();
    localStorage.setItem(key, sid);
  }
  return sid;
}

export function clearSession(publicKey) {
  localStorage.removeItem(PREFIX + publicKey);
}

function _uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
