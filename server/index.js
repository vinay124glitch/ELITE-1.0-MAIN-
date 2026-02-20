import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// MongoDB Schemas
const eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    type: String,
    date: String,
    time: String,
    maxParticipants: Number,
    venue: String,
    registered: { type: Number, default: 0 },
    status: { type: String, default: 'upcoming' },
    image: String,
    schedule: Array
});

const userSchema = new mongoose.Schema({
    firebaseId: { type: String, unique: true },
    name: String,
    email: { type: String, unique: true },
    role: { type: String, default: 'participant' },
    photoURL: String,
    password: String // For manual login fallback if used
});

// Firebase Configuration
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const registrationSchema = new mongoose.Schema({
    eventId: String,
    userId: String,
    name: String,
    email: String,
    status: { type: String, default: 'confirmed' },
    checkIn: { type: Boolean, default: false },
    registrationDate: String
});

const teamSchema = new mongoose.Schema({
    name: String,
    eventId: String,
    members: Array,
    maxMembers: { type: Number, default: 4 },
    inviteCode: String
});

const notificationSchema = new mongoose.Schema({
    title: String,
    message: String,
    recipients: String,
    read: { type: Boolean, default: false },
    type: { type: String, default: 'info' },
    timestamp: { type: Number, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);
const User = mongoose.model('User', userSchema);
const Registration = mongoose.model('Registration', registrationSchema);
const Team = mongoose.model('Team', teamSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// --- API Endpoints ---

// Events
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find();
        res.json(events.map(e => ({ ...e._doc, id: e._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/events', async (req, res) => {
    try {
        const newEvent = new Event(req.body);
        await newEvent.save();
        res.status(201).json({ ...newEvent._doc, id: newEvent._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Event updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        await Event.findByIdAndDelete(req.params.id);
        res.json({ message: 'Event deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users.map(u => ({ ...u._doc, id: u._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { firebaseId, email, name, role, photoURL, password } = req.body;
        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { firebaseId, email, name, role, photoURL, password } },
            { upsert: true, new: true }
        );
        res.json({ ...user._doc, id: user._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Registrations
app.get('/api/registrations', async (req, res) => {
    try {
        const regs = await Registration.find();
        res.json(regs.map(r => ({ ...r._doc, id: r._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/registrations', async (req, res) => {
    try {
        const reg = new Registration(req.body);
        await reg.save();
        res.status(201).json({ ...reg._doc, id: reg._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/registrations/:id', async (req, res) => {
    try {
        await Registration.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Registration updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/registrations/:id', async (req, res) => {
    try {
        await Registration.findByIdAndDelete(req.params.id);
        res.json({ message: 'Registration cancelled' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Teams
app.get('/api/teams', async (req, res) => {
    try {
        const teams = await Team.find();
        res.json(teams.map(t => ({ ...t._doc, id: t._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/teams', async (req, res) => {
    try {
        const team = new Team(req.body);
        await team.save();
        res.status(201).json({ ...team._doc, id: team._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/teams/:id', async (req, res) => {
    try {
        await Team.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: 'Team updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
    try {
        const notifs = await Notification.find().sort({ timestamp: -1 });
        res.json(notifs.map(n => ({ ...n._doc, id: n._id })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/notifications', async (req, res) => {
    try {
        const notif = new Notification(req.body);
        await notif.save();
        res.status(201).json({ ...notif._doc, id: notif._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/notifications/:id', async (req, res) => {
    try {
        const notif = await Notification.findByIdAndUpdate(
            req.params.id, req.body, { new: true }
        );
        if (!notif) return res.status(404).json({ error: 'Notification not found' });
        res.json({ ...notif._doc, id: notif._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Smart MongoDB Connection: try real DB first, fall back to in-memory
async function startServer() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/elite-db';

    try {
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        console.log('🍃 MongoDB Connected to:', MONGO_URI);
    } catch (err) {
        console.warn('⚠️  Real MongoDB not found. Starting in-memory database...');
        const mongod = await MongoMemoryServer.create();
        const memUri = mongod.getUri();
        await mongoose.connect(memUri);
        console.log('🟡 In-Memory MongoDB started at:', memUri);
        console.log('📝 Note: Data will be cleared when the server restarts.');
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

startServer();
