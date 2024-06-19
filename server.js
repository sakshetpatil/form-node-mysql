const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'registrationdb'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected');
});

// Bodyparser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
console.log(__dirname)

app.post('/register', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), (req, res) => {
    const { username, password, email, gender, address, mobile, dob, education, hobbies } = req.body;

    const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
    const resumePath = req.files['resume'] ? req.files['resume'][0].path : null;

    // Check if email already exists in the database
    const checkEmailQuery = `SELECT * FROM user WHERE email = ?`;
    db.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error checking email');
        }
        
        if (results.length > 0) {
            // Email already exists in the database
            return res.status(400).send('Email is already in use');
        } else {
            // Email does not exist, proceed with registration
            const insertUserQuery = `INSERT INTO user (username, password, email, gender, address, mobile, dob, education, hobbies, photo_path, resumePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            db.query(insertUserQuery, [username, password, email, gender, address, mobile, dob, education, hobbies, photoPath, resumePath], (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('Error registering user');
                }
                res.send('User registered successfully');
            });
        }
    });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
