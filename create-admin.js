#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔧 Admin User Setup for Gemini Vision Extension');
console.log('==============================================\n');

const API_URL = process.env.NODE_ENV === 'production' 
    ? 'https://kimaaka-server.onrender.com/api'
    : 'http://localhost:3000/api';

async function createAdmin() {
    return new Promise((resolve) => {
        rl.question('Enter admin email: ', (email) => {
            rl.question('Enter admin password: ', (password) => {
                rl.close();
                resolve({ email, password });
            });
        });
    });
}

async function main() {
    try {
        const { email, password } = await createAdmin();
        
        console.log('\n🚀 Creating admin user...');
        
        const response = await fetch(`${API_URL}/create-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Admin user created successfully!');
            console.log(`📧 Email: ${data.user.email}`);
            console.log(`🔑 Admin ID: ${data.user.id}`);
            console.log(`\n🌐 Access admin panel at: ${API_URL.replace('/api', '')}/admin/admin.html`);
        } else {
            console.error('❌ Error creating admin user:', data.error);
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
        console.log('\n🔍 Make sure your server is running and accessible.');
    }
}

main();
