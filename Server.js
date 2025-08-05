const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3000;

const USERS_FILE = path.join(__dirname, 'users.json');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files like HTML, CSS, JS

// Helper: Read users
const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return data.trim() ? JSON.parse(data) : [];
  } catch (err) {
    console.error('❌ Error reading users file:', err);
    return [];
  }
};

// Helper: Write users
const writeUsers = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('❌ Error writing to users file:', err);
  }
};

// GET /api/users
app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// POST /api/users
app.post('/api/users', (req, res) => {
  try {
    const newUser = req.body;

    // Validate required fields
    const requiredFields = ['firstName', 'email', 'username', 'password'];
    for (const field of requiredFields) {
      if (!newUser[field]) {
        return res.status(400).json({ message: `${field} is required.` });
      }
    }

    const users = readUsers();

    // Check duplicate email
    if (users.some(u => u.email === newUser.email)) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    users.push(newUser);
    writeUsers(users);
    res.status(201).json({ message: 'User added successfully.' });

  } catch (err) {
    console.error('❌ Error in POST /api/users:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// DELETE /api/users/:email
app.delete('/api/users/:email', (req, res) => {
  try {
    const email = req.params.email;
    const users = readUsers();
    const updated = users.filter(user => user.email !== email);

    if (users.length === updated.length) {
      return res.status(404).json({ message: 'User not found.' });
    }

    writeUsers(updated);
    res.json({ message: 'User deleted successfully.' });

  } catch (err) {
    console.error('❌ Error in DELETE /api/users:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// POST /api/login
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const users = readUsers();

    const found = users.find(u => u.username === username && u.password === password);
    if (found) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

  } catch (err) {
    console.error('❌ Error in POST /api/login:', err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
