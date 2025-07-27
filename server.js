const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for admin panel
app.use('/admin', express.static(path.join(__dirname, '../')));

// Connect to MongoDB with extended timeout settings
mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 30000, // Increase server selection timeout to 30 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    maxPoolSize: 10, // Maintain up to 10 socket connections
    retryWrites: true, // Retry failed writes
    w: 'majority' // Write concern
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if can't connect to database
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
    } catch (error) {
        console.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
});

// User Schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// API Key Schema for admin management
const apiKeySchema = new mongoose.Schema({
    keyName: {
        type: String,
        required: true,
        unique: true
    },
    apiKey: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    usageCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
const ApiKey = mongoose.model('ApiKey', apiKeySchema);

// Helper function to get least used API key
const getLeastUsedApiKey = async () => {
    try {
        const apiKey = await ApiKey.findOne({ isActive: true })
            .sort({ usageCount: 1, lastUsed: 1 })
            .lean();
        
        if (!apiKey) {
            throw new Error('No active API keys available');
        }
        
        // Update usage count and last used
        await ApiKey.findByIdAndUpdate(apiKey._id, {
            $inc: { usageCount: 1 },
            lastUsed: new Date()
        });
        
        return apiKey.apiKey;
    } catch (error) {
        console.error('Error getting API key:', error);
        throw new Error('Unable to allocate API key');
    }
};

// JWT middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbStates = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        if (dbState === 1) {
            // Test database with a simple query
            await mongoose.connection.db.admin().ping();
            res.json({ 
                status: 'healthy', 
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({ 
                status: 'unhealthy', 
                database: dbStates[dbState] || 'unknown',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Health check error:', error);
        res.status(503).json({ 
            status: 'unhealthy', 
            database: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Sign up
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists with timeout handling
        const existingUser = await User.findOne({ email }).maxTimeMS(20000); // 20 second timeout
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }

        // Create new user (no API key required)
        const user = new User({
            email,
            password
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific MongoDB timeout errors
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ 
                error: 'Database connection timeout. Please try again in a moment.',
                details: 'The server is experiencing connectivity issues with the database.'
            });
        }
        
        if (error.name === 'MongoServerSelectionError') {
            return res.status(503).json({ 
                error: 'Database server unavailable. Please try again later.',
                details: 'Cannot connect to the database server.'
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user with timeout handling
        const user = await User.findOne({ email }).maxTimeMS(20000); // 20 second timeout
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific MongoDB timeout errors
        if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
            return res.status(503).json({ 
                error: 'Database connection timeout. Please try again in a moment.',
                details: 'The server is experiencing connectivity issues with the database.'
            });
        }
        
        if (error.name === 'MongoServerSelectionError') {
            return res.status(503).json({ 
                error: 'Database server unavailable. Please try again later.',
                details: 'Cannot connect to the database server.'
            });
        }
        
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get API key for any user (no authentication required)
app.get('/api/gemini-key', async (req, res) => {
    try {
        // Get least used API key dynamically
        const apiKey = await getLeastUsedApiKey();
        res.json({ geminiApiKey: apiKey });

    } catch (error) {
        console.error('Get API key error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Admin middleware
const authenticateAdmin = (req, res, next) => {
    authenticateToken(req, res, (err) => {
        if (err) return;
        
        if (!req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
};

// Admin routes for API key management
app.get('/api/admin/api-keys', authenticateAdmin, async (req, res) => {
    try {
        const apiKeys = await ApiKey.find().sort({ createdAt: -1 });
        res.json(apiKeys);
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/admin/api-keys', authenticateAdmin, async (req, res) => {
    try {
        const { keyName, apiKey } = req.body;

        if (!keyName || !apiKey) {
            return res.status(400).json({ error: 'Key name and API key are required' });
        }

        const newApiKey = new ApiKey({
            keyName,
            apiKey
        });

        await newApiKey.save();
        res.status(201).json({ message: 'API key added successfully', apiKey: newApiKey });

    } catch (error) {
        console.error('Add API key error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'API key name already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/admin/api-keys/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { keyName, apiKey, isActive } = req.body;

        const updatedApiKey = await ApiKey.findByIdAndUpdate(
            id,
            { keyName, apiKey, isActive },
            { new: true }
        );

        if (!updatedApiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ message: 'API key updated successfully', apiKey: updatedApiKey });

    } catch (error) {
        console.error('Update API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete('/api/admin/api-keys/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const deletedApiKey = await ApiKey.findByIdAndDelete(id);

        if (!deletedApiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ message: 'API key deleted successfully' });

    } catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get API key statistics
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const totalKeys = await ApiKey.countDocuments();
        const activeKeys = await ApiKey.countDocuments({ isActive: true });
        const totalUsers = await User.countDocuments();
        const totalUsage = await ApiKey.aggregate([
            { $group: { _id: null, total: { $sum: '$usageCount' } } }
        ]);

        res.json({
            totalKeys,
            activeKeys,
            totalUsers,
            totalUsage: totalUsage[0]?.total || 0
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify token endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
    res.json({ 
        message: 'Token is valid',
        user: {
            id: req.user.userId,
            email: req.user.email,
            isAdmin: req.user.isAdmin
        }
    });
});

// Logout (client-side token removal, but we can log it)
app.post('/api/logout', authenticateToken, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Create first admin user endpoint (only if no admin exists)
app.post('/api/create-admin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Check if any admin already exists
        const existingAdmin = await User.findOne({ isAdmin: true });
        if (existingAdmin) {
            return res.status(400).json({ error: 'Admin already exists' });
        }

        // Create admin user
        const adminUser = new User({
            email,
            password,
            isAdmin: true
        });

        await adminUser.save();

        res.status(201).json({
            message: 'Admin user created successfully',
            user: {
                id: adminUser._id,
                email: adminUser.email,
                isAdmin: adminUser.isAdmin
            }
        });

    } catch (error) {
        console.error('Create admin error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ error: 'User already exists with this email' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Kimaaka-moodle Server running on port ${PORT}`);
    console.log(`Admin panel available at: http://localhost:${PORT}/admin/admin.html`);
    console.log(`API endpoint (no auth required): http://localhost:${PORT}/api/gemini-key`);
});
