const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer);

const activeSockets = {};
const rooms = {};

io.on('connection', (socket) => {
    console.log('User Connected', socket.id);


    // Event handler for creating a new room
    socket.on('createRoom', (code) => {
        const roomCode = code; // Function to generate a unique room code
        rooms[roomCode] = { players: [socket.id] }; // Store the room details (you can add more data as needed)
        socket.join(roomCode); // Add the socket to the room
        socket.emit('roomCreated', roomCode); // Notify the client about the created room
        console.log(`User ${socket.id} created room ${roomCode}`);
    });

    // Event handler for joining an existing room
    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode] && rooms[roomCode].players.length < 2) {
            rooms[roomCode].players.push(socket.id);
            socket.join(roomCode);
            socket.emit('roomJoined', roomCode); // Notify the client about the joined room
            console.log(`User ${socket.id} joined room ${roomCode}`);

            if (rooms[roomCode].players.length === 2) {
                console.log('2 users');
                // Emit an event to notify clients that the game can start
                io.to(roomCode).emit('gameStart');
            }
        } else {
            socket.emit('roomError', 'Room is full or does not exist'); // Notify the client about the error
        }


    });


    activeSockets[socket.id] = socket;

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
        delete activeSockets[socket.id];
    });

    socket.on('turn', (data) => {
        roomCode = data.roomCode;
        currentRow = data.guess;
        console.log(`Received player move`);
        // Handle the playerMove event

        // Broadcast the move to all other connected clients except the sender
        socket.to(roomCode).emit('opponentTurn', currentRow+1);
    });

    socket.on('win', (data) => {
        console.log('recieved player win');
       currentRow = data.guess;
       roomCode = data.roomCode;
        // Handle the playerMove event

        // Broadcast the move to all other connected clients except the sender
        socket.to(roomCode).emit('opponentWin', currentRow);
    });
    socket.on('data', (secret) => {
        console.log(`Received player data`);
        // Handle the playerMove event
        const roomCode = secret.roomCode;
        const oppName = secret.pname;
        const oppWord = secret.secret;

        // Broadcast the move to all other connected clients except the sender
        socket.to(roomCode).emit('data', {name:oppName, word:oppWord});
    });

  });

app.use(express.static("public"));

httpServer.listen(3000);