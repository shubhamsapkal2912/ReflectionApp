const express = require('express');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const app = express();

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


// Session Middleware
app.use(
  session({
    secret: 'xxxxx', // Replace with a secure random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Use `true` if using HTTPS
  })
);

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'ubfxdd1iqb@Ss',
  database: 'reflection_app',
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Helper function to generate a unique link code (random string generation)
function generateUniqueLinkCode() {
  return Math.random().toString(36).substr(2, 32); // 32-character random string
}

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Registration route
app.post('/register', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required!');
  }

  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        return res.status(400).send('Email already registered.');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO users (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        (err) => {
          if (err) throw err;
          res.send('User registered successfully!');
        }
      );
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred during registration.');
  }
});

// Login route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(400).send('Invalid email or password');
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    req.session.userId = user.id; // Save user ID in session
    req.session.username = email.split('@')[0]; // Extract username from email

    res.redirect(`/dashboard/${user.id}`); // Redirect to the user's dashboard
  });
});

// Dashboard route
app.get('/dashboard/:userId', (req, res) => {
  const { userId } = req.params;

  if (req.session.userId !== parseInt(userId, 10)) {
    return res.status(403).send('Unauthorized access');
  }

  db.query('SELECT * FROM feedback_forms WHERE user_id = ?', [userId], (err, results) => {
    if (err) throw err;

    res.send(`
      <html>
        <head>
          <title>Dashboard</title>
        </head>
        <body>
          <h2>Welcome to your Dashboard</h2>
          <button onclick="window.location.href='/create-feedback'">Create New Feedback Form</button>
          <h3>Your Feedback Forms</h3>
          <ul>
            ${results.map((form) => `
              <li>
                <a href="/view-feedback/${form.link_code}">${form.title}</a>
              </li>
            `).join('')}
          </ul>
        </body>
      </html>
    `);
  });
});

// Route to render the form to create feedback
app.get('/create-feedback', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create-feedback.html'));
});

// Create feedback form
app.post('/create-feedback', (req, res) => {
  const { title, userId } = req.body;

  if (!title || !userId) {
    return res.status(400).send('Title and User ID are required!');
  }

  const linkCode = generateUniqueLinkCode();

  db.query(
    'INSERT INTO feedback_forms (user_id, title, link_code) VALUES (?, ?, ?)',
    [userId, title, linkCode],
    (err) => {
      if (err) {
        console.error('Error creating feedback form:', err);
        return res.status(500).send('Error creating feedback form.');
      }

      const feedbackLink = `http://localhost:3000/feedback/${linkCode}`;
      res.send(`Feedback form created! Share the link: ${feedbackLink}`);
    }
  );
});

// Feedback form route
app.get('/feedback/:linkCode', (req, res) => {
  const { linkCode } = req.params;

  db.query('SELECT * FROM feedback_forms WHERE link_code = ?', [linkCode], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.status(404).send('Feedback form not found');
    }

    res.sendFile(path.join(__dirname, 'public', 'feedback.html'));
  });
});

// Submit feedback
app.post('/submit-feedback/:linkCode', (req, res) => {
  const { linkCode } = req.params;
  const { participantName, feedback } = req.body;

  console.log('Request params:', linkCode);
  console.log('Request body:', req.body);

  db.query(
      'INSERT INTO feedback_responses (form_id, participant_name, feedback) SELECT id, ?, ? FROM feedback_forms WHERE link_code = ?',
      [participantName, feedback, linkCode],
      (err) => {
          if (err) {
              console.error('Error saving feedback:', err);
              return res.status(500).send('An error occurred while submitting feedback.');
          }

          res.send('<h2>Thank you for your feedback!</h2>');
      }
  );
});

// View feedback responses
app.get('/view-feedback/:linkCode', (req, res) => {
  const { linkCode } = req.params;

  db.query('SELECT * FROM feedback_responses WHERE form_id IN (SELECT id FROM feedback_forms WHERE link_code = ?)', [linkCode], (err, results) => {
    if (err) throw err;

    res.send(`
      <h2>Feedback Responses:</h2>
      <ul>
        ${results.map((response) => `<li>${response.participant_name}: ${response.feedback}</li>`).join('')}
      </ul>
    `);
  });
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
