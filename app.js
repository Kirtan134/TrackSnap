const express = require('express');
const app = express();
const http = require('http');
const socket = require('socket.io');
const path = require('path');

const server = http.createServer(app);

const io = socket(server);

app.set('view engine', 'ejs');
//app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.static('public'))
 app.use('/static', express.static(path.join(__dirname, 'public')))

io.on('connection', function(socket){
    socket.on('sendLocation', (data) => {
        io.emit('receiveLocation', {id: socket.id, ...data});
    });
    console.log('a user connected');
    socket.on('disconnect', () => {
        io.emit('user-disconnected', socket.id);
        console.log('user disconnected');
    });
});

app.get('/', (req, res) => {
    res.render("landing");
});

// Route for the main application
app.get('/app', (req, res) => {
    res.render("index");
});

server.listen(3000);