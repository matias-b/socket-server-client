
// Para compilar: gcc client.c -o client -lpthread
// Ejecutar ./client ip puerto

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <pthread.h>

#define SERVER_RESPONSE_SIZE 2000
#define MSG_SIZE 2000

// Muestra los parametros
void print_help()
{
    printf("Uso: client <host> <puerto>\n");
    printf("Parametros:\n");
    printf("  <host>    Dirección IP o nombre del servidor\n");
    printf("  <puerto>  Puerto del servidor\n");
}

// Hilo para recibir mensajes asíncronamente
void *receive_messages(void *socket_desc)
{
    int sock = *(int *)socket_desc;
    char server_response[SERVER_RESPONSE_SIZE];
    int read_size;

    while ((read_size = recv(sock, server_response, SERVER_RESPONSE_SIZE, 0)) > 0)
    {
        server_response[read_size] = '\0'; // Agregar fin de string
        printf("%s\n", server_response); // Muestra el mensaje desde el servidor
        printf("> "); // mostrar el prompt
        fflush(stdout);
        memset(server_response, 0, SERVER_RESPONSE_SIZE); // Limpiar el buffer
    }

    if (read_size == 0)
    {
        printf("Desconectado del servidor.\n");
        exit(0);
    }

    else if (read_size == -1)
    {
        printf("Error al recibir el mensaje.\n");
    }

    return 0;
}

int main(int argc, char *argv[])
{
    // Verificar que existan parametros
    if (argc != 3)
    {
        print_help();
        return 1;
    }

    // leer ip y puerto por parametro
    char *server_ip = argv[1];
    int server_port = atoi(argv[2]);

    int sock;
    struct sockaddr_in server_addr;
    char message[MSG_SIZE];

    // Crear el socket
    sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == -1)
    {
        printf("No se pudo crear el socket\n");
        return 1;
    }

    server_addr.sin_addr.s_addr = inet_addr(server_ip); //IP del servidor
    server_addr.sin_family = AF_INET; // tipo TCP
    server_addr.sin_port = htons(server_port); // puerto del servidor

    printf("Conectado al servidor %s en el puerto %d\n", server_ip, server_port);

    // Crear el hilo para recibir mensajes
    pthread_t recv_thread;
    if (pthread_create(&recv_thread, NULL, receive_messages, (void *)&sock) < 0)
    {
        printf("No se pudo crear el hilo para recibir mensajes\n");
        return 1;
    }

        // Conectar al servidor
    if (connect(sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) < 0)
    {
        printf("Error al conectar\n");
        return 1;
    }

    // Comunicación con el servidor - enviar mensajes
    while (1)
    {
        printf("> ");
        fgets(message, MSG_SIZE, stdin);

        // Eliminar el salto de línea final
        message[strcspn(message, "\n")] = 0;

        if (send(sock, message, strlen(message), 0) < 0)
        {
            printf("Error al enviar el mensaje\n");
            return 1;
        }
        memset(message, 0, MSG_SIZE);
    }

    // Esperar a que el hilo de recepción termine
    pthread_join(recv_thread, NULL);

    close(sock);
    return 0;
}
