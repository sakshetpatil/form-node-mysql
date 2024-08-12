
const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(cookieParser())
app.use(session({
    key:'user_sid',
    secret: "thisisrandomstuff",
    resave: false,
    saveUninitialized: false,
    cookie:{
        expires: 30 * 60 * 1000
    }
}));

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

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

//for user register
app.post('/register', upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), (req, res) => {
    const { username, password, email, gender, address, mobile, dob, education, hobbies } = req.body;
    const photoPath = req.files['photo'] ? '/uploads/' + req.files['photo'][0].filename : null;
    const resumePath = req.files['resume'] ? '/uploads/' + req.files['resume'][0].filename : null;


    const checkEmailQuery = 'SELECT * FROM user WHERE email = ?';
    db.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Error checking email');
        }

        if (results.length > 0) {
            return res.status(400).send('Email already exists');
        }

        const insertUserQuery = `INSERT INTO user (username, password, email, gender, address, mobile, dob, education, hobbies, photo_path, resumePath) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        db.query(insertUserQuery, [username, password, email, gender, address, mobile, dob, education, hobbies.join(', '), photoPath, resumePath], (err, result) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Error registering user');
            }
            res.redirect('/login.html');
        });
    });
});

app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user && !req.session.admin) {
        res.clearCookie('user_sid');
    }
    next();
});


//for user page
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    next();
}

app.post('/login', (req, res) => {
    console.log('login req');
    const { username, password } = req.body;
    const query = 'SELECT username, iduser FROM user WHERE username = ? AND password = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        if (results.length > 0) {
           
            const user = results[0];

            req.session.user = results[0];
           
            console.log(req.session.user.username);
           // alert('hi');
            res.redirect('/user.html');
        } else {
            //alert('Invalid username or password');
            res.status(401).send('Invalid username or password');
        }
    });
});

app.get('/logout', (req, res) => {
    console.log('logout req');
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            res.status(500).send('Logout failed.');
        } else {
            res.clearCookie('user_sid');
            res.redirect('/login.html');
        }
    });
});


app.get('/user', requireLogin, (req, res) => {
    const username = req.session.user.username;
    const sql = `SELECT * FROM user WHERE username = ?`;
    db.query(sql, [username], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch user details' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result[0];
        const userDetails = {
            username: user.username,
            email: user.email,
            gender: user.gender,
            address: user.address,
            mobile: user.mobile,
            dob: user.dob,
            education: user.education,
            hobbies: user.hobbies,
            photo_path: user.photo_path,
            resumePath: user.resumePath
           //session_username: req.session.user_details.username
        };
        console.log(userDetails);
        res.json(userDetails);
        
    });
});

//user profile update
app.post('/edit-profile', requireLogin, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), (req, res) => {
    const { username, email, gender, address, mobile, dob, education, hobbies } = req.body;
    const photoPath = req.files['photo'] ? '/uploads/' + req.files['photo'][0].filename : null;
    const resumePath = req.files['resume'] ? '/uploads/' + req.files['resume'][0].filename : null;

    const userId = req.session.user.iduser;

    let updateFields = [];
    let values = [];
    
    if (email) {
        updateFields.push('email = ?');
        values.push(email);
    }
    if (gender) {
        updateFields.push('gender = ?');
        values.push(gender);
    }
    if (address) {
        updateFields.push('address = ?');
        values.push(address);
    }
    if (mobile) {
        updateFields.push('mobile = ?');
        values.push(mobile);
    }
    if (dob) {
        updateFields.push('dob = ?');
        values.push(dob);
    }
    if (education) {
        updateFields.push('education = ?');
        values.push(education);
    }
    if (hobbies) {
        updateFields.push('hobbies = ?');
        values.push(hobbies.join(', '));
    }
    if (photoPath) {
        updateFields.push('photo_path = ?');
        values.push(photoPath);
    }
    if (resumePath) {
        updateFields.push('resumePath = ?');
        values.push(resumePath);
    }

    if (updateFields.length === 0) {
        return res.status(400).send('No fields to update');
    }

    const updateQuery = `
        UPDATE user
        SET ${updateFields.join(', ')}
        WHERE username = ?
    `;
    values.push(username);

    db.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating profile');
        }

        if (email) req.session.user.email = email;
        if (gender) req.session.user.gender = gender;
        if (address) req.session.user.address = address;
        if (mobile) req.session.user.mobile = mobile;
        if (dob) req.session.user.dob = dob;
        if (education) req.session.user.education = education;
        if (hobbies) req.session.user.hobbies = hobbies;

        res.redirect('/user.html');
    });
});




// For admin login

function requireAdmin(req, res, next) {
    if (!req.session.admin) {
        return res.redirect('/admin-login.html');
    }
    next();
}

app.post('/admin-login',(req,res) => {
    console.log('admin-login req');
    const {username,password} = req.body;
    const sql = 'SELECT username,password from admin WHERE username = ? AND password = ?';
    db.query(sql, [username,password], (err,results) => {
        if(err) {
            console.log(err)
            return res.status(500).send('Internal Server Error');
        }
        if(results.length > 0) {
            const admin = results[0];

            req.session.admin = results[0];

            console.log(req.session.admin.username);

            res.redirect('/admin.html');
        } else {
            res.status(401).send('Invalid username and password');
        }
    });
});


app.get('/admin', requireAdmin, (req, res) => {
    const sql = 'SELECT iduser, username, email, gender, address, mobile, dob, education, hobbies, photo_path, resumePath FROM user';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.render('admin', { users: results });
    });
});


app.get('/users', requireAdmin, (req, res) => {
    const sql = 'SELECT * FROM user'; 
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ error: 'Failed to fetch users' });
        }
        res.json(results); 
    });
});

//update user
app.post('/update', requireAdmin, upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), (req, res) => {
    const { username, email, gender, address, mobile, dob, education, hobbies } = req.body;
    const photoPath = req.files['photo'] ? '/uploads/' + req.files['photo'][0].filename : null;
    const resumePath = req.files['resume'] ? '/uploads/' + req.files['resume'][0].filename : null;

    let updateFields = [];
    let values = [];
    
    if (email) {
        updateFields.push('email = ?');
        values.push(email);
    }
    if (gender) {
        updateFields.push('gender = ?');
        values.push(gender);
    }
    if (address) {
        updateFields.push('address = ?');
        values.push(address);
    }
    if (mobile) {
        updateFields.push('mobile = ?');
        values.push(mobile);
    }
    if (dob) {
        updateFields.push('dob = ?');
        values.push(dob);
    }
    if (education) {
        updateFields.push('education = ?');
        values.push(education);
    }
    if (hobbies) {
        updateFields.push('hobbies = ?');
        values.push(hobbies.join(', '));
    }
    if (photoPath) {
        updateFields.push('photo_path = ?');
        values.push(photoPath);
    }
    if (resumePath) {
        updateFields.push('resumePath = ?');
        values.push(resumePath);
    }

    if (updateFields.length === 0) {
        return res.status(400).send('No fields to update');
    }

    const updateQuery = `
        UPDATE user
        SET ${updateFields.join(', ')}
        WHERE username = ?
    `;
    values.push(username);

    db.query(updateQuery, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error updating profile');
        }

        if (email) req.session.admin.email = email;
        if (gender) req.session.admin.gender = gender;
        if (address) req.session.admin.address = address;
        if (mobile) req.session.admin.mobile = mobile;
        if (dob) req.session.admin.dob = dob;
        if (education) req.session.admin.education = education;
        if (hobbies) req.session.admin.hobbies = hobbies;

        res.redirect('/admin.html');
    });
});


//For delete user
app.post('/delete-user', requireAdmin, (req, res) => {
    const email = req.body.email;
    const sql = 'DELETE FROM user WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error deleting user');
            return;
        }
        console.log('User deleted successfully');
        res.redirect('/admin.html'); 
    });
});

//check admin session
app.get('/checkSession', (req, res) => {
    if (req.session.admin) {
        res.status(200).send('Session is active');
    } else {
        res.status(401).send('Session expired');
    }
});

app.get('/users/:iduser', requireAdmin, (req, res) => {
    const userId = parseInt(req.params.iduser);
    db.query('SELECT * FROM user WHERE iduser = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ error: 'User not found' });
        res.json(results[0]);
    });
});

//Admin logout
app.get('/admin-logout', requireAdmin, (req, res) => {
    console.log('admin-logout req');
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }
        res.clearCookie('user_sid');
        res.redirect('/admin-login.html');
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
