const net = require('net');
const readline = require('readline');


let username;

// Configuración para leer entradas del usuario
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Conectarse al servidor de chat
const client = net.createConnection({ localAddress: "127.0.0.1", port: 30000 }, () => {
    console.log('Conectado al servidor de chat.');
});

// Callback al recibir datos del servidor
client.on('data', (data) => {
    console.log(data.toString().trim());
});

// Callback al cerrarse la conexion
client.on('end', () => {
    console.log('Desconectado del servidor.');
    rl.close();
});

// Callback al ocurrir un error
client.on('error', (err) => {
    console.error(`Error: ${err.message}`);
    rl.close();
});

// Leer mensajes del usuario y enviarlos al servidor
rl.on('line', (input) => {
        client.write(input);
        
});
