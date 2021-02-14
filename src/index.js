// Este módulo une directorios para linux / windows ..
const path = require('path');

// Requerimos el modulo http de node.js
const http = require('http');

// Se guarda en una constante el la función express.
const express = require('express');

// 1- Genera un objeto del sevidor con metodos y propiedades.
const app = express(); // La activamos.

// 2- Creamos un servidor, con la configuración de express.
const server = http.createServer(app);

// 3 - El servidor enviará al navegador la carpeta entre ''.
// C:\Users\atina\Desktop\PuzzleLolSkins\public
app.use(express.static(path.join(__dirname, 'public')));


// Settings

// Coge el puerto del servidor y si no tiene pues dale el 3000.
app.set('port', process.env.PORT || 3000);


// A sockets le envio el servidor para que escuche las conexiones.

// Esta constante tiene almacenadas todas las conexiones de los navegadores.

// Es un módulo que permite realizar conexiones en tiempo real. (Protocolo de Websockets)

const io = require('socket.io')(server);

// Requiero este archivo (que es en realidad una funcion) y lo invoco con este parametro.
require('./sockets.js')(io);


// Método de entrada para el usuario.
server.listen(app.get('port'), () => {
  //  console.log('Estás usando el puerto 3000');
});