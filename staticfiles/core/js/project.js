console.log("=== project.js loaded ===");

(function($) {
    'use strict';
    
    $(document).ready(function() {
        console.log("jQuery Ready in project.js");
        console.log("Found employee-select:", $('.employee-select').length);
        console.log("Found pm-modal:", $('.pm-modal').length);
        
        // Initialize Select2 when any modal is shown
        $('.pm-modal').on('shown.bs.modal', function() {
            console.log("Modal shown event fired");
            
            var $modal = $(this);
            var $selects = $('.employee-select', $modal);
            
            console.log("Found selects in this modal:", $selects.length);
            
            $selects.each(function() {
                var $select = $(this);
                
                // Destroy existing Select2 if already initialized
                if ($select.hasClass('select2-hidden-accessible')) {
                    console.log("Destroying existing Select2");
                    $select.select2('destroy');
                }
                
                // Initialize Select2
                console.log("Initializing Select2");
                $select.select2({
                    placeholder: "Select estimators",
                    allowClear: true,
                    width: '100%',
                    dropdownParent: $modal
                });
            });
        });
        
        // Destroy Select2 when modal is hidden
        $('.pm-modal').on('hidden.bs.modal', function() {
            console.log("Modal hidden event fired");
            $('.employee-select', this).each(function() {
                if ($(this).hasClass('select2-hidden-accessible')) {
                    $(this).select2('destroy');
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

        socket.onopen = function() {
            console.log("WebSocket connected for notifications.");
        };

        socket.onmessage = function(e) {
            const data = JSON.parse(e.data);
            const msg = data.message;
            console.log("Notification received:", msg);
            showNotification(msg);
        };

        socket.onclose = function(e) {
            console.log("Socket is closed. Reconnecting in 3 seconds...", e.reason);
            setTimeout(function() {
                connect();
            }, 3000);
        };

        socket.onerror = function(err) {
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

            notification.onclick = function() {
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

})(jQuery);

console.log("=== project.js finished loading ===");