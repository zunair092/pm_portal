$(document).ready(function () {
    $('.employee-select').select2({
        placeholder: "Select estimators",
        width: '100%'
    });
    $('.modal').on('shown.bs.modal', function () {
        $(this).find('.employee-select').each(function () {
            if (!$(this).hasClass('select2-hidden-accessible')) {
                $(this).select2({
                    placeholder: "Select estimators",
                    width: '100%',
                    dropdownParent: $(this).closest('.modal')
                });
            }
        });
    });
});

// =============================================
// WebSocket - Real-Time Notification System
// =============================================
console.log("Setting up WebSocket...");
const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
const wsPath = wsScheme + window.location.host + "/ws/notifications/";
let socket = null;
let isReloading = false;

function connect() {
    socket = new WebSocket(wsPath);

    socket.onopen = function () {
        console.log("WebSocket connected for notifications.");
        isReloading = false; // reset on reconnect
    };

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log("Received WebSocket message:", data);

        // ── project_added always wins — check BEFORE isReloading ──
        if (data.type === "project_added") {
            const projectName = data.project_name ? `"${data.project_name}"` : "A new project";
            const clientInfo = data.client_name ? ` (${data.client_name})` : "";
            showNotification(`🚀 Project Updated: ${projectName}${clientInfo}`, "primary");
            scheduleReload(1500);
            return;
        }

        // Prevent stacking multiple reloads
        if (isReloading) return;

        // ── Personal notification ──
        if (data.type === "notification") {
            console.log("Notification received:", data.message);
            if (data.message) showNotification(data.message, "info");
            scheduleReload(2000);
            return;
        }

        // ── Backward compatibility ──
        if (data.message && !data.type) {
            showNotification(data.message, "info");
            scheduleReload(2000);
        }
    };

    socket.onclose = function (e) {
        console.log("Socket closed. Reconnecting in 3 seconds...", e.reason);
        isReloading = false; // reset so reconnect works cleanly
        setTimeout(function () {
            connect();
        }, 3000);
    };

    socket.onerror = function (err) {
        console.error("Socket error:", err.message, "— closing socket");
        socket.close();
    };
}

// ── Schedule a page reload with a "Refreshing..." banner ──
function scheduleReload(delayMs) {
    if (isReloading) return;
    isReloading = true;

    const banner = document.createElement("div");
    banner.id = "ws-refresh-banner";
    banner.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(30, 30, 30, 0.85);
        color: #fff;
        padding: 10px 24px;
        border-radius: 30px;
        font-size: 13px;
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(4px);
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;
    banner.innerHTML = `
        <span style="display:inline-block;animation:wsSpin 0.8s linear infinite">⟳</span>
        Refreshing page…
    `;
    document.body.appendChild(banner);

    setTimeout(() => {
        window.location.reload();
    }, delayMs);
}

// ── Show in-page toast notification ──
function showNotification(message, type = "primary") {
    if (Notification.permission === "granted") {
        const desktopNote = new Notification("PM Portal Update", {
            body: message,
            icon: "/static/core/img/logo.png",
            silent: false
        });
        desktopNote.onclick = function () {
            window.focus();
            this.close();
        };
    }

    const container = document.getElementById("notification-container") || createAlertContainer();
    const colorMap = {
        primary: { border: "#3b82f6", bg: "#eff6ff", text: "#1e40af", icon: "🔔" },
        info:    { border: "#6366f1", bg: "#eef2ff", text: "#3730a3", icon: "ℹ️"  },
        success: { border: "#10b981", bg: "#ecfdf5", text: "#065f46", icon: "✅" },
        warning: { border: "#f59e0b", bg: "#fffbeb", text: "#92400e", icon: "⚠️" },
        danger:  { border: "#ef4444", bg: "#fef2f2", text: "#991b1b", icon: "❌" },
    };
    const c = colorMap[type] || colorMap.primary;
    const toast = document.createElement("div");
    toast.style.cssText = `
        background: ${c.bg};
        border-left: 4px solid ${c.border};
        color: ${c.text};
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        font-size: 13.5px;
        line-height: 1.5;
        display: flex;
        align-items: flex-start;
        gap: 10px;
        min-width: 300px;
        max-width: 380px;
        animation: wsSlideIn 0.3s ease;
        margin-bottom: 0;
    `;
    toast.innerHTML = `
        <span style="font-size:16px;flex-shrink:0;margin-top:1px">${c.icon}</span>
        <div style="flex:1">
            <div style="font-weight:600;margin-bottom:2px">PM Portal Update</div>
            <div style="opacity:0.9">${message}</div>
        </div>
        <button onclick="this.closest('[data-ws-toast]').remove()"
                style="background:none;border:none;cursor:pointer;font-size:16px;opacity:0.5;padding:0;line-height:1;flex-shrink:0">
            ×
        </button>
    `;
    toast.setAttribute("data-ws-toast", "true");
    container.appendChild(toast);

    setTimeout(() => {
        if (toast && toast.parentNode) {
            toast.style.animation = "wsSlideOut 0.3s ease";
            setTimeout(() => toast.remove(), 280);
        }
    }, 7000);
}

function createAlertContainer() {
    const container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 99998;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;
    document.body.appendChild(container);
    return container;
}

(function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
        @keyframes wsSlideIn {
            from { opacity: 0; transform: translateX(30px); }
            to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes wsSlideOut {
            from { opacity: 1; transform: translateX(0);    }
            to   { opacity: 0; transform: translateX(30px); }
        }
        @keyframes wsSpin {
            from { transform: rotate(0deg);   }
            to   { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
})();

if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

connect();