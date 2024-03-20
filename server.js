const express = require("express");
const jwt = require('jsonwebtoken');
const { initializeApp, credential } = require('firebase-admin/app');
const admin = require('firebase-admin');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var serviceAccount = require("./noticeboardapp-c42f2-firebase-adminsdk-370td-899c593d93.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const topic = "Highscore";

const message = {
    notification: {
        title:  'New High Score!',
        body: 'You got a new high score!'
    },
    data: {
        score: '850',
        time: '2:45'
    },
    topic: topic,
    android: {
        priority: 'high',
    },
    webpush: {
        headers: {
            Urgency: 'high'
        }
    }
};

admin.messaging().send(message)
    .then((response) => {
        // Response is a message ID string.
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        console.log('Error sending message:', error);
    });


const secretKey = 'your_secret_key';

const imageData = [];

// Dummy user credentials
const users = [
    { username: 'mmtest', password: '1234' },
];

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: Missing token' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized: Invalid token' });
        }
        req.user = decoded;
        next();
    });
};

// Route to generate JWT token
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find(user => user.username === username && user.password === password);
    if (user) {
        const token = jwt.sign({ username: user.username }, secretKey);
        res.status(200).send({ token });
    } else {
        res.status(401).send({ message: 'Invalid username or password' });
    }
});

app.post("/api/add_image", verifyToken, (req, res) => {
    console.log("Result", req.body);

    const imgdata = {
        "id": imageData.length + 1,
        "imgbase64": req.body.imgbase64,
    }

    imageData.push(imgdata);
    console.log("final", imageData);

    res.status(200).send({
        "status_code": 200,
        "message": "Image added successfully",
        "image": imgdata
    });
});

app.get("/api/all_images", verifyToken, (req, res) => {

    if (imageData.length > 0) {
        res.status(200).send({
            "status_code": 200,
            "image": imageData
        })
    } else {
        res.status(200).send({
            "status_code": 200,
            "image": "No Image Found!"
        })
    }
});

app.listen(8000, () => {
    console.log('Server is running on port 8000');
});
