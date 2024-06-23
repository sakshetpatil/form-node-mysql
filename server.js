// const express = require('express');
// const multer = require('multer');
// const mysql = require('mysql2');
// const bodyParser = require('body-parser');
// const path = require('path');

// const app = express();

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     filename: function (req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });

// const upload = multer({ storage });

// const db = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: 'root',
//     database: 'registrationdb'
// });

// db.connect((err) => {
//     if (err) {
//         throw err;
//     }
//     console.log('MySQL connected');
// });

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(express.static(path.join(__dirname, 'public')));
// console.log(__dirname)

// app.post('/register', upload.fields([
//     { name: 'photo', maxCount: 1 },
//     { name: 'resume', maxCount: 1 }
// ]), (req, res) => {
//     const { username, password, email, gender, address, mobile, dob, education, hobbies } = req.body;

//     const checkEmailQuery = `SELECT * FROM user WHERE email = ?`;
//     db.query(checkEmailQuery, [email], (err, results) => {
//         if (err) {
//             console.log(err);
//             return res.status(500).send('Database error');
//         }

//         if (results.length > 0) {
//             // Email already exists
//             return res.status(400).send('Email already registered');
//         }

//     const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
//     const resumePath = req.files['resume'] ? req.files['resume'][0].path : null;

//     const insertUserQuery = `INSERT INTO user (username, password, email, gender, address, mobile, dob, education, hobbies, photo_path, resumePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     db.query(insertUserQuery, [username, password, email, gender, address, mobile, dob, education, hobbies, photoPath, resumePath], (err, result) => {
//         if (err) {
//             console.log(err);
//             res.status(500).send('Error registering user');
//         } else {
//             res.redirect('/login.html');
//         }
//     });
// });

// app.post('/admin/login', (req, res) => {
//     const { username, password } = req.body;

//     const adminUsername = 'sakshet ravindra patil';
//     const adminPassword = 'sakshet123';

//     if (username === adminUsername && password === adminPassword) {
//         req.session.admin = true;
//         res.redirect('/admin.html'); 
//     } else {
//         res.status(401).send('Invalid credentials');
//     }
// });


// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session'); 

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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'your_secret_key',
    resave: true,
    saveUninitialized: true
}));

app.post('/register', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), (req, res) => {
    const { username, password, email, gender, address, mobile, dob, education, hobbies } = req.body;


        const photoPath = req.files['photo'] ? req.files['photo'][0].path : null;
        const resumePath = req.files['resume'] ? req.files['resume'][0].path : null;

        const insertUserQuery = `INSERT INTO user (username, password, email, gender, address, mobile, dob, education, hobbies, photo_path, resumePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertUserQuery, [username, password, email, gender, address, mobile, dob, education, hobbies, photoPath, resumePath], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error registering user');
            }
            res.redirect('/login.html');
        });
    });

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;

    const adminUsername = 'sakshet ravindra patil';
    const adminPassword = 'sakshet123';

    if (username === adminUsername && password === adminPassword) {
        req.session.admin = true;
        res.redirect('/admin.html'); 
    } else {
        res.status(401).send('Invalid credentials');
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
