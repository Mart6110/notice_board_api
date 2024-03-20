const express = require("express"); // Importing express module
const jwt = require('jsonwebtoken'); // Importing jsonwebtoken module for token generation and verification
const { initializeApp, credential } = require('firebase-admin/app'); // Importing Firebase admin modules
const admin = require('firebase-admin');

const app = express(); // Creating express app instance

app.use(express.json()); // Middleware to parse incoming JSON requests
app.use(express.urlencoded({ extended: true })); // Middleware to parse incoming URL-encoded requests

var serviceAccount = require("./noticeboardapp-c42f2-firebase-adminsdk-370td-899c593d93.json"); // Firebase service account credentials

// Initializing Firebase app with service account credentials
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const topic = "Highscore"; // Topic for Firebase Cloud Messaging

const message = {
    notification: {
        title:  'New High Score!', // Notification title
        body: 'You got a new high score!' // Notification body
    },
    data: {
        score: '850', // Additional data
        time: '2:45' // Additional data
    },
    topic: topic, // Sending message to a specific topic
    android: {
        priority: 'high', // Priority for Android
    },
    webpush: {
        headers: {
            Urgency: 'high' // Header for web push notifications
        }
    }
};

// Sending message using Firebase Cloud Messaging
admin.messaging().send(message)
    .then((response) => {
        // Handling successful message sending
        console.log('Successfully sent message:', response);
    })
    .catch((error) => {
        // Handling error while sending message
        console.log('Error sending message:', error);
    });

const secretKey = 'your_secret_key'; // Secret key for JWT token generation

const imageData = []; // Array to store image data

// Dummy user credentials
const users = [
    { username: 'mmtest', password: '1234' },
];

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']; // Extracting token from request headers
    if (!token) {
        return res.status(401).send({ message: 'Unauthorized: Missing token' }); // Sending error response if token is missing
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'Unauthorized: Invalid token' }); // Sending error response if token is invalid
        }
        req.user = decoded; // Storing decoded user data in request object
        next(); // Proceeding to next middleware
    });
};

// Route to generate JWT token
app.post("/api/login", (req, res) => {
    const { username, password } = req.body; // Extracting username and password from request body
    const user = users.find(user => user.username === username && user.password === password); // Checking user credentials
    if (user) {
        const token = jwt.sign({ username: user.username }, secretKey); // Generating JWT token
        res.status(200).send({ token }); // Sending token in response
    } else {
        res.status(401).send({ message: 'Invalid username or password' }); // Sending error response for invalid credentials
    }
});

// Route to add image with authentication
app.post("/api/add_image", verifyToken, (req, res) => {
    console.log("Result", req.body); // Logging request body

    const imgdata = {
        "id": imageData.length + 1, // Generating unique ID for image
        "imgbase64": req.body.imgbase64, // Extracting base64 encoded image data from request body
    }

    imageData.push(imgdata); // Adding image data to array
    console.log("final", imageData); // Logging final image data array

    res.status(200).send({
        "status_code": 200,
        "message": "Image added successfully",
        "image": imgdata // Sending response with added image data
    });
});

// Route to get all images with authentication
app.get("/api/all_images", verifyToken, (req, res) => {

    if (imageData.length > 0) {
        res.status(200).send({
            "status_code": 200,
            "image": imageData // Sending response with all image data
        })
    } else {
        res.status(200).send({
            "status_code": 200,
            "image": "No Image Found!" // Sending response if no images found
        })
    }
});

app.listen(8000, () => {
    console.log('Server is running on port 8000'); // Starting server and logging port
});
