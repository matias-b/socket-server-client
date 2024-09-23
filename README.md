## TCP Server-Client Chat

Example of a chat server in Node.js using TCP sockets, with Node.js and C clients

## Usage

- Start the server: `node server.js`

- Start the client: `node client.js`

- Build the C client: `gcc client.c -o client -lpthread`

- Start the C client: `./client 127.0.0.1 30000`