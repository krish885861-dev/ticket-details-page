(function () {
  "use strict";

  const STORAGE_KEYS = {
    ORIGINAL_MESSAGE: "ticket_500014181477_original_message",
    REPLIES: "ticket_500014181477_replies",
    TICKET_ID: "ticket_500014181477_ticket_id",
    TICKET_DATE: "ticket_500014181477_ticket_date",
    CHAT_DATE: "ticket_500014181477_chat_date"
  };

  const DEFAULT_TICKET_ID = "500014181477";
  const DEFAULT_TICKET_DATE = "14 Oct";
  const DEFAULT_CHAT_DATE = "Wed, 14/10";

  const DEFAULT_ORIGINAL_MESSAGE = [
    "Dear Merchant,",
    "",
    "Greetings from Paytm Payments",
    "",
    "The payment acceptance limit of your Paytm payments merchant account has been reduced because we have noticed some transactions that are not in line with your business activities.",
    "",
    "To restore your payment limits and avoid any further issues like settlement delay or account block, please upload the required documents quickly.",
    "",
    "Documents Required:",
    "",
    "a. Shop photos (Interior & Exterior) with a clearly visible signboard",
    "",
    "b. Invoices for the transactions listed below:",
    "",
    "• Proprietorship / Non-Proprietorship merchants: Please share the relevant invoices",
    "",
    "• Individual entity merchants: Please share a clarification letter on plain white paper",
    "",
    "Transaction Details: (transaction IDs, order IDs, dates, amounts)",
    "",
    "20261003110870000312947456896180048 - T2610030104235999537213 - 2026-10-03 - 40000",
    "",
    "20261012110840000316523490232450032 - PTM20a20d5c4fc54cefab2a6237b2b994dc - 2026-10-12 - 17000"
  ].join("\n");

  // DOM Elements
  const backBtn = document.getElementById("backBtn");
  const ticketMetaDisplay = document.getElementById("ticketMetaDisplay");
  const ticketSubtitle = document.getElementById("ticketSubtitle");
  const editTicketMetaBtn = document.getElementById("editTicketMetaBtn");
  const ticketMetaEditor = document.getElementById("ticketMetaEditor");
  const editTicketIdInput = document.getElementById("editTicketIdInput");
  const editTicketDateInput = document.getElementById("editTicketDateInput");
  const saveTicketMetaBtn = document.getElementById("saveTicketMetaBtn");
  const cancelTicketMetaBtn = document.getElementById("cancelTicketMetaBtn");
  const chatDateDisplay = document.getElementById("chatDateDisplay");
  const chatDateText = document.getElementById("chatDateText");
  const editChatDateBtn = document.getElementById("editChatDateBtn");
  const chatDateEditor = document.getElementById("chatDateEditor");
  const editChatDateInput = document.getElementById("editChatDateInput");
  const saveChatDateBtn = document.getElementById("saveChatDateBtn");
  const cancelChatDateBtn = document.getElementById("cancelChatDateBtn");
  const chatStream = document.getElementById("chatStream");
  const originalMessageBody = document.getElementById("originalMessageBody");
  const editMessageBtn = document.getElementById("editMessageBtn");
  const originalMessageEditor = document.getElementById("originalMessageEditor");
  const editMessageTextarea = document.getElementById("editMessageTextarea");
  const saveEditBtn = document.getElementById("saveEditBtn");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  const repliesContainer = document.getElementById("repliesContainer");
  const composerForm = document.getElementById("composerForm");
  const messageInput = document.getElementById("messageInput");
  const attachBtn = document.getElementById("attachBtn");
  const cameraBtn = document.getElementById("cameraBtn");
  const fileInput = document.getElementById("fileInput");
  const cameraInput = document.getElementById("cameraInput");
  const attachmentPreview = document.getElementById("attachmentPreview");
  const micBtn = document.getElementById("micBtn");
  const sendBtn = document.getElementById("sendBtn");
  const toastEl = document.getElementById("toast");

  // State
  let currentTicketId = loadFromStorage(STORAGE_KEYS.TICKET_ID, DEFAULT_TICKET_ID);
  let currentTicketDate = loadFromStorage(STORAGE_KEYS.TICKET_DATE, DEFAULT_TICKET_DATE);
  let currentChatDate = loadFromStorage(STORAGE_KEYS.CHAT_DATE, DEFAULT_CHAT_DATE);
  let currentOriginalMessage = loadFromStorage(
    STORAGE_KEYS.ORIGINAL_MESSAGE,
    DEFAULT_ORIGINAL_MESSAGE
  );
  let replies = loadRepliesFromStorage();
  let pendingAttachments = [];
  let toastTimer = null;

  // Storage Helpers
  function loadFromStorage(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function saveToStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      // Ignore storage errors in restricted environments
    }
  }

  function loadRepliesFromStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.REPLIES);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  function saveRepliesToStorage() {
    saveToStorage(STORAGE_KEYS.REPLIES, JSON.stringify(replies));
  }

  // Toast Helper
  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("show");
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 2400);
  }

  // Safe HTML Escaping
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Render Original Message Preserving Formatting
  function renderOriginalMessage(text) {
    const blocks = text.split(/\n\s*\n/);
    const htmlParts = blocks.map(function (block) {
      const trimmed = block.trim();
      if (!trimmed) return "";

      if (trimmed.startsWith("•")) {
        const cleanBulletText = trimmed.replace(/^•\s*/, "");
        return '<div class="bullet-item">' + escapeHtml(cleanBulletText).replace(/\n/g, "<br>") + "</div>";
      }

      if (/^\d{20,}\s*-\s*/.test(trimmed)) {
        return '<p class="tx-line">' + escapeHtml(trimmed).replace(/\n/g, "<br>") + "</p>";
      }

      return "<p>" + escapeHtml(trimmed).replace(/\n/g, "<br>") + "</p>";
    });

    originalMessageBody.innerHTML = htmlParts.join("");
  }

  // Render Replies
  function renderReplies() {
    repliesContainer.innerHTML = "";
    replies.forEach(function (reply) {
      const row = document.createElement("div");
      row.className = "message-row message-row--outgoing";

      const bubble = document.createElement("div");
      bubble.className = "reply-bubble";

      if (reply.text) {
        const textEl = document.createElement("div");
        textEl.className = "reply-text";
        textEl.textContent = reply.text;
        bubble.appendChild(textEl);
      }

      if (Array.isArray(reply.attachments) && reply.attachments.length > 0) {
        const attWrap = document.createElement("div");
        attWrap.className = "reply-attachments";
        reply.attachments.forEach(function (att) {
          const tag = document.createElement("span");
          tag.className = "reply-attachment-tag";
          tag.textContent = "📎 " + att.name;
          attWrap.appendChild(tag);
        });
        bubble.appendChild(attWrap);
      }

      const meta = document.createElement("div");
      meta.className = "reply-meta";
      meta.textContent = reply.timestamp || "";
      bubble.appendChild(meta);

      row.appendChild(bubble);
      repliesContainer.appendChild(row);
    });
  }

  // Scroll Helpers
  function scrollToBottom(smooth) {
    chatStream.scrollTo({
      top: chatStream.scrollHeight,
      behavior: smooth ? "smooth" : "auto"
    });
  }

  // Render Ticket Meta & Chat Date
  function renderTicketMeta() {
    ticketSubtitle.textContent = "Ticket ID: " + currentTicketId + ", " + currentTicketDate;
    document.title = "Profile & Account related issue - Ticket ID: " + currentTicketId;
  }

  function renderChatDate() {
    chatDateText.textContent = currentChatDate;
  }

  function enterTicketMetaEditMode() {
    editTicketIdInput.value = currentTicketId;
    editTicketDateInput.value = currentTicketDate;
    ticketMetaDisplay.classList.add("hidden");
    ticketMetaEditor.classList.remove("hidden");
    editTicketIdInput.focus();
  }

  function exitTicketMetaEditMode() {
    ticketMetaEditor.classList.add("hidden");
    ticketMetaDisplay.classList.remove("hidden");
  }

  function saveTicketMeta() {
    const nextId = editTicketIdInput.value.trim();
    const nextDate = editTicketDateInput.value.trim();
    if (!nextId || !nextDate) {
      showToast("Ticket ID and date cannot be empty");
      return;
    }
    currentTicketId = nextId;
    currentTicketDate = nextDate;
    saveToStorage(STORAGE_KEYS.TICKET_ID, currentTicketId);
    saveToStorage(STORAGE_KEYS.TICKET_DATE, currentTicketDate);
    renderTicketMeta();
    exitTicketMetaEditMode();
    showToast("Ticket details updated");
  }

  function enterChatDateEditMode() {
    editChatDateInput.value = currentChatDate;
    chatDateDisplay.classList.add("hidden");
    chatDateEditor.classList.remove("hidden");
    editChatDateInput.focus();
  }

  function exitChatDateEditMode() {
    chatDateEditor.classList.add("hidden");
    chatDateDisplay.classList.remove("hidden");
  }

  function saveChatDate() {
    const nextChatDate = editChatDateInput.value.trim();
    if (!nextChatDate) {
      showToast("Date cannot be empty");
      return;
    }
    currentChatDate = nextChatDate;
    saveToStorage(STORAGE_KEYS.CHAT_DATE, currentChatDate);
    renderChatDate();
    exitChatDateEditMode();
    showToast("Date updated");
  }

  // Edit Existing Message Flow
  function enterEditMode() {
    editMessageTextarea.value = currentOriginalMessage;
    originalMessageBody.classList.add("hidden");
    editMessageBtn.classList.add("hidden");
    originalMessageEditor.classList.remove("hidden");
    editMessageTextarea.focus();
  }

  function exitEditMode() {
    originalMessageEditor.classList.add("hidden");
    originalMessageBody.classList.remove("hidden");
    editMessageBtn.classList.remove("hidden");
  }

  function saveEditedMessage() {
    const updated = editMessageTextarea.value.trim();
    if (!updated) {
      showToast("Message cannot be empty");
      editMessageTextarea.focus();
      return;
    }
    currentOriginalMessage = updated;
    saveToStorage(STORAGE_KEYS.ORIGINAL_MESSAGE, currentOriginalMessage);
    renderOriginalMessage(currentOriginalMessage);
    exitEditMode();
    showToast("Message saved");
  }

  function cancelEditedMessage() {
    editMessageTextarea.value = currentOriginalMessage;
    exitEditMode();
  }

  // Composer Helpers
  function updateComposerButtons() {
    const hasText = messageInput.value.trim().length > 0;
    const hasAttachments = pendingAttachments.length > 0;
    if (hasText || hasAttachments) {
      micBtn.classList.add("hidden");
      sendBtn.classList.remove("hidden");
    } else {
      sendBtn.classList.add("hidden");
      micBtn.classList.remove("hidden");
    }
  }

  function autoResizeTextarea() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 110) + "px";
  }

  function renderAttachmentPreview() {
    attachmentPreview.innerHTML = "";
    if (pendingAttachments.length === 0) {
      attachmentPreview.classList.add("hidden");
      updateComposerButtons();
      return;
    }

    attachmentPreview.classList.remove("hidden");
    pendingAttachments.forEach(function (att, index) {
      const chip = document.createElement("div");
      chip.className = "attachment-chip";

      const label = document.createElement("span");
      label.textContent = att.name;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.setAttribute("aria-label", "Remove " + att.name);
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", function () {
        pendingAttachments.splice(index, 1);
        renderAttachmentPreview();
      });

      chip.appendChild(label);
      chip.appendChild(removeBtn);
      attachmentPreview.appendChild(chip);
    });

    updateComposerButtons();
  }

  function handleFilesSelected(fileList) {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach(function (file) {
      pendingAttachments.push({
        name: file.name,
        size: file.size
      });
    });
    renderAttachmentPreview();
  }

  function formatCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function sendReply(event) {
    if (event) event.preventDefault();
    const text = messageInput.value.trim();
    if (!text && pendingAttachments.length === 0) {
      return;
    }

    const newReply = {
      id: Date.now(),
      text: text,
      attachments: pendingAttachments.slice(),
      timestamp: formatCurrentTime()
    };

    replies.push(newReply);
    saveRepliesToStorage();
    renderReplies();

    // Clear input and attachments
    messageInput.value = "";
    messageInput.style.height = "auto";
    pendingAttachments = [];
    fileInput.value = "";
    cameraInput.value = "";
    renderAttachmentPreview();
    updateComposerButtons();

    scrollToBottom(true);
  }

  // Event Listeners
  backBtn.addEventListener("click", function () {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      showToast("Back navigation (demonstration page)");
    }
  });

  editTicketMetaBtn.addEventListener("click", enterTicketMetaEditMode);
  saveTicketMetaBtn.addEventListener("click", saveTicketMeta);
  cancelTicketMetaBtn.addEventListener("click", exitTicketMetaEditMode);
  editTicketIdInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTicketMeta();
    } else if (event.key === "Escape") {
      exitTicketMetaEditMode();
    }
  });
  editTicketDateInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveTicketMeta();
    } else if (event.key === "Escape") {
      exitTicketMetaEditMode();
    }
  });

  editChatDateBtn.addEventListener("click", enterChatDateEditMode);
  saveChatDateBtn.addEventListener("click", saveChatDate);
  cancelChatDateBtn.addEventListener("click", exitChatDateEditMode);
  editChatDateInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveChatDate();
    } else if (event.key === "Escape") {
      exitChatDateEditMode();
    }
  });

  editMessageBtn.addEventListener("click", enterEditMode);
  saveEditBtn.addEventListener("click", saveEditedMessage);
  cancelEditBtn.addEventListener("click", cancelEditedMessage);

  messageInput.addEventListener("input", function () {
    autoResizeTextarea();
    updateComposerButtons();
  });

  messageInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendReply();
    }
  });

  composerForm.addEventListener("submit", sendReply);

  attachBtn.addEventListener("click", function () {
    fileInput.click();
  });

  cameraBtn.addEventListener("click", function () {
    cameraInput.click();
  });

  fileInput.addEventListener("change", function (event) {
    handleFilesSelected(event.target.files);
  });

  cameraInput.addEventListener("change", function (event) {
    handleFilesSelected(event.target.files);
  });

  micBtn.addEventListener("click", function () {
    showToast("Voice recording is disabled in this demonstration");
  });

  // Initial Render
  renderTicketMeta();
  renderChatDate();
  renderOriginalMessage(currentOriginalMessage);
  renderReplies();
  updateComposerButtons();
})();

