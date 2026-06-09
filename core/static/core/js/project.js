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

// WebSocket - Notification System
console.log("Setting up WebSocket...");

const wsScheme = window.location.protocol === "https:" ? "wss://" : "ws://";
const wsPath = wsScheme + window.location.host + "/ws/notifications/";
let socket = null;

function connect() {
    socket = new WebSocket(wsPath);

    socket.onopen = function () {
        console.log("WebSocket connected for notifications.");
    };

    socket.onmessage = function (e) {
        const data = JSON.parse(e.data);

        console.log("Received WebSocket message:", data);

        // Auto reload when a new project is added
        if (data.type === "project_added") {
            console.log("New project added. Reloading page...");

            // Optional notification before reload
            showNotification(
                `New Project Added: ${data.project_name || ''}`
            );

            setTimeout(() => {
                location.reload();
            }, 1000);

            return;
        }

        // Existing notifications
        if (data.type === "notification") {
            console.log("Notification received:", data.message);
            showNotification(data.message);
        }

        // Backward compatibility with old messages
        if (data.message && !data.type) {
            showNotification(data.message);
        }
    };
    socket.onclose = function (e) {
        console.log("Socket is closed. Reconnecting in 3 seconds...", e.reason);
        setTimeout(function () {
            connect();
        }, 3000);
    };

    socket.onerror = function (err) {
        console.error("Socket encountered error:", err.message, "Closing socket");
        socket.close();
    };
}

function showNotification(message) {
    // Desktop Toast Notification
    if (Notification.permission === "granted") {
        const notification = new Notification("PM Portal Update", {
            body: message,
            icon: "/static/core/img/logo.png",
            silent: false
        });
        notification.onclick = function () {
            window.focus();
            this.close();
        };
    }

    // In-Page UI Alert
    const alertContainer = document.getElementById('notification-container') || createAlertContainer();

    const alertBox = document.createElement('div');
    alertBox.className = "alert alert-primary alert-dismissible fade show shadow-lg border-start border-4 border-primary";
    alertBox.role = "alert";
    alertBox.style.marginBottom = "10px";
    alertBox.style.minWidth = "300px";

    alertBox.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="me-3">
                    <strong>🔔 New Update</strong>
                </div>
                <div>${message}</div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    alertContainer.appendChild(alertBox);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (alertBox) {
            alertBox.classList.remove('show');
            setTimeout(() => alertBox.remove(), 500);
        }
    }, 8000);
}

function createAlertContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Request notification permissions on startup
if (Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
}

// Initialize WebSocket connection
connect();
