const MESSAGES = {
  vi: {
    botOnline: "Trực tuyến",
    close: "Đóng",
    inputAria: "Nhập tin nhắn",
    resetConversation: "↺ Xóa cuộc trò chuyện",
    poweredBy: "Powered by",
    timeoutMessage: "Timeout — vui lòng thử lại.",
    connectError: "Không thể kết nối tới server.",
    references: "Tham khảo:",
  },
  en: {
    botOnline: "Online",
    close: "Close",
    inputAria: "Type your message",
    resetConversation: "↺ Reset conversation",
    poweredBy: "Powered by",
    timeoutMessage: "Request timed out — please try again.",
    connectError: "Cannot connect to server.",
    references: "References:",
  },
};

export function resolveLocale(input) {
  const raw = String(input || "").toLowerCase();
  if (!raw) return "vi";
  if (raw.startsWith("en")) return "en";
  return "vi";
}

export function t(locale, key) {
  const lang = resolveLocale(locale);
  return MESSAGES[lang]?.[key] || MESSAGES.vi[key] || key;
}
