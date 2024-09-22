const net = require('net');
const readline = require('readline');

const LISTEN_PORT = 30000
const LISTEN_ADDR = "0.0.0.0"

// Lista de clientes conectados
let clients = [];

// Enviar un mensaje a todos los clientes conectados, excepto al cliente emisor
const broadcastMessage = (message, sender) => {
    clients.forEach(client => {
        if (client !== sender) {
            client.write(message);
        }
    });
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Manejar comandos del servidor y mensajes a los clientes
rl.on('line', (input) => {
    if (input === '/h' || input === '/help' || input === '/ayuda') {
        console.log('Comandos disponibles:\n' +
            '/h, /help, /ayuda: Muestra esta ayuda.\n' +
            `/listar: Muestra los usuarios conectados.\n` +
            '/kick <usuario>: Expulsa a un usuario del chat.\n');
    } else if (input === '/listar') {
        let userList = 'Usuarios conectados:\n';
        clients.forEach(client => {
            userList += `${client.username || 'Desconocido'}\n`;
        });
        console.log(userList)
    } else if (input.startsWith('/kick')) {
        if (input.split(' ').length !== 2) {
            console.log('Uso: /kick <usuario>');
            return;
        }
        // Extraer el nombre de usuario a expulsar
        const nameToKick = input.trim().replace('/kick ', '');

        // Busca si existe un usuario con ese nombre
        const kickedClient = clients.find(client => client.username === nameToKick);

        if (kickedClient) {
            kickedClient.write('Has sido expulsado del chat');
            kickedClient.end();
            console.log(`Usuario ${nameToKick} expulsado`);
        } else {
            console.log('Usuario no encontrado');
        }
    } else {
        broadcastMessage(`> Servidor: ${input}\n`);
    }
});

// Crea el servidor TCP, con un callback para cada nueva conexión
const server = net.createServer((socket) => {
    // Conexión del nuevo cliente
    // Texto rojo y fondo negro
    socket.write(`\x1b[31;40;1mBienvenido al chat! Ingresa tu nombre de usuario:`);

    console.log(`> Cliente conectado desde ${socket.remoteAddress}:${socket.remotePort}`);
    let username = '';

    socket.on('data', (data) => {
        const message = data.toString().trim();

        if (!username) {
            username = data.toString().trim(); // Extraer el nombre de usuario
            //Texto celeste fondo negro
            socket.write(`\x1b[36;40;1mHola ${username}! Puedes comenzar a chatear.\n`);

            socket.username = username;

            const msg = `${username} se ha unido al chat.\n`

            console.log(msg);
            broadcastMessage(msg, socket);
            clients.push(socket);
        } else {
            // Procesar comandos y mensajes del cliente
            //Ayuda
            if (message === '/h' || message === '/help' || message === '/ayuda') {
                socket.write(`Comandos disponibles:\n` +
                    `/h, /help, /ayuda: Muestra esta ayuda.\n` +
                    `/quitar: Desconecta del chat.\n` +
                    `/listar: Muestra los usuarios conectados.\n` +
                    `/whoami: Muestra tu nombre de usuario.\n`);

            // Desconectarse
            } else if (message === '/quitar') {
                socket.write('Te has desconectado del chat.\n');
                broadcastMessage(`${username} ha dejado el chat.\n`, socket);
                clients = clients.filter(client => client !== socket);
                socket.end();

            // Mostrar usuarios conectados
            } else if (message === '/listar') {
                let userList = 'Usuarios conectados:\n';
                clients.forEach(client => {
                    userList += `${client.username || 'Desconocido'}\n`;
                });
                socket.write(userList);

            // Mostrar al usuario su nombre
            } else if (message === '/whoami') {
                socket.write(`Tu nombre de usuario es: ${username}\n`);
            } else {
                // Notificar que ingreso un comando inexistente si el mensaje comienza con /
                if (message.startsWith("/")) {
                    socket.write('Comando no reconocido. Escribe /h para obtener ayuda.\n');
                } else {
                    // Mensaje de chat a todos los usuarios
                    console.log(username + ' dice: ' + message);
                    broadcastMessage(`${username}: ${message}\n`, socket);
                }
            }
        }
    });

    socket.on('end', () => {
        clients = clients.filter(client => client !== socket);
        broadcastMessage(`${username} ha dejado el chat.\n`, socket);
    });

    socket.on('error', (err) => {
        console.error(`Error en la conexión con ${username}: ${err.message}`);
    });
});

server.listen(LISTEN_PORT, LISTEN_ADDR, () => {
    console.log(`Servidor de chat escuchando ${LISTEN_ADDR}:${LISTEN_PORT}`);
});
