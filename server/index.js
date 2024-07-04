const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 8080;
const SECRET_KEY = 'your_secret_key';

app.use(cors()); // Enable CORS
app.use(bodyParser.json());

app.post('/login', (req, res) => {
  const { username } = req.body;
  console.log('Login request received:', username);
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  console.log('Token generated:', token);
  res.json({ token });
});

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

const authenticate = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (e) {
    console.log('Token authentication failed:', e);
    return null;
  }
};

wss.on('connection', (ws, req) => {
  const token = req.url.split('?token=')[1];
  console.log('Connection request with token:', token);
  const user = authenticate(token);
  
  if (!user) {
    console.log('Authentication failed for token:', token);
    ws.close();
    return;
  }

  console.log('User authenticated:', user.username);
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    console.log('Message received:', parsedMessage);
    
    // Include the sender's username in the message
    const broadcastMessage = {
      ...parsedMessage,
      sender: user.username
    };

    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(broadcastMessage));
      }
    });
  });

  ws.send(JSON.stringify({ type: 'welcome', message: `Welcome ${user.username} to the chat server!`, sender: 'Server' }));
});
