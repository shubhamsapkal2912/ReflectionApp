const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Replace with your MySQL username
  password: 'ubfxdd1iqb@Ss', // Replace with your MySQL password
  database: 'reflection_db',
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL Database.');
  }
});

module.exports = db;
