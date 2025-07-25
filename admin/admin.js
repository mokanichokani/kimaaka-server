// admin.js

const API_BASE_URL = 'https://kimaaka-server.onrender.com/api';

class AdminPanel {
    constructor() {
        this.authToken = localStorage.getItem('adminToken');
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Login
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Add API Key
        document.getElementById('addKeyBtn').addEventListener('click', () => this.handleAddApiKey());

        // Auto refresh stats every 30 seconds
        setInterval(() => {
            if (this.authToken) {
                this.loadStats();
            }
        }, 30000);
    }

    async checkAuthStatus() {
        if (!this.authToken) {
            this.showLoginSection();
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/verify`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.user.isAdmin) {
                    this.showAdminPanel(data.user);
                } else {
                    this.showError('loginError', 'Admin access required');
                    this.handleLogout();
                }
            } else {
                this.handleLogout();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.handleLogout();
        }
    }

    async handleLogin() {
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;

        if (!email || !password) {
            this.showError('loginError', 'Please fill in all fields');
            return;
        }

        this.setLoginLoading(true);
        this.hideError('loginError');

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                if (!data.user.isAdmin) {
                    this.showError('loginError', 'Admin access required');
                    this.setLoginLoading(false);
                    return;
                }

                this.authToken = data.token;
                localStorage.setItem('adminToken', data.token);
                this.showAdminPanel(data.user);
            } else {
                this.showError('loginError', data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', 'Connection error. Please check if the server is running.');
        }

        this.setLoginLoading(false);
    }

    handleLogout() {
        this.authToken = null;
        localStorage.removeItem('adminToken');
        this.showLoginSection();
    }

    async handleAddApiKey() {
        const keyName = document.getElementById('keyName').value.trim();
        const apiKey = document.getElementById('apiKeyInput').value.trim();

        if (!keyName || !apiKey) {
            this.showError('addKeyError', 'Please fill in all fields');
            return;
        }

        this.hideError('addKeyError');
        this.hideSuccess('addKeySuccess');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/api-keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ keyName, apiKey })
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('addKeySuccess', 'API key added successfully!');
                document.getElementById('keyName').value = '';
                document.getElementById('apiKeyInput').value = '';
                this.loadApiKeys();
                this.loadStats();
            } else {
                this.showError('addKeyError', data.error || 'Failed to add API key');
            }
        } catch (error) {
            console.error('Add API key error:', error);
            this.showError('addKeyError', 'Connection error. Please try again.');
        }
    }

    async toggleApiKeyStatus(id, isActive) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/api-keys/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isActive: !isActive })
            });

            if (response.ok) {
                this.loadApiKeys();
                this.loadStats();
            }
        } catch (error) {
            console.error('Toggle API key error:', error);
        }
    }

    async deleteApiKey(id) {
        if (!confirm('Are you sure you want to delete this API key?')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/api-keys/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.loadApiKeys();
                this.loadStats();
            }
        } catch (error) {
            console.error('Delete API key error:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const stats = await response.json();
                document.getElementById('totalKeysCount').textContent = stats.totalKeys;
                document.getElementById('activeKeysCount').textContent = stats.activeKeys;
                document.getElementById('totalUsersCount').textContent = stats.totalUsers;
                document.getElementById('totalUsageCount').textContent = stats.totalUsage;
            }
        } catch (error) {
            console.error('Load stats error:', error);
        }
    }

    async loadApiKeys() {
        const loading = document.getElementById('keysLoading');
        const table = document.getElementById('apiKeysTable');
        const tbody = document.getElementById('apiKeysTableBody');

        loading.style.display = 'block';
        table.style.display = 'none';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/api-keys`, {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const apiKeys = await response.json();
                this.renderApiKeysTable(apiKeys);
                loading.style.display = 'none';
                table.style.display = 'table';
            }
        } catch (error) {
            console.error('Load API keys error:', error);
            loading.textContent = 'Error loading API keys';
        }
    }

    renderApiKeysTable(apiKeys) {
        const tbody = document.getElementById('apiKeysTableBody');
        tbody.innerHTML = '';

        apiKeys.forEach(key => {
            const row = document.createElement('tr');
            const lastUsed = key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never';
            const apiKeyPreview = key.apiKey.substring(0, 20) + '...';

            row.innerHTML = `
                <td><strong>${key.keyName}</strong></td>
                <td><span class="api-key-preview">${apiKeyPreview}</span></td>
                <td>
                    <span class="status-badge ${key.isActive ? 'status-active' : 'status-inactive'}">
                        ${key.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td><span class="usage-count">${key.usageCount}</span></td>
                <td>${lastUsed}</td>
                <td>
                    <button class="btn" onclick="adminPanel.toggleApiKeyStatus('${key._id}', ${key.isActive})">
                        ${key.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn btn-danger" onclick="adminPanel.deleteApiKey('${key._id}')">
                        Delete
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    showLoginSection() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').classList.remove('active');
        this.clearLoginForm();
    }

    showAdminPanel(user) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').classList.add('active');
        document.getElementById('adminEmailDisplay').textContent = user.email;
        
        this.loadStats();
        this.loadApiKeys();
    }

    clearLoginForm() {
        document.getElementById('adminEmail').value = '';
        document.getElementById('adminPassword').value = '';
        this.hideError('loginError');
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }

    hideError(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    showSuccess(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }

    hideSuccess(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    setLoginLoading(isLoading) {
        const loginBtn = document.getElementById('loginBtn');
        
        if (isLoading) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Logging in...';
        } else {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    }
}

// Initialize admin panel
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});
