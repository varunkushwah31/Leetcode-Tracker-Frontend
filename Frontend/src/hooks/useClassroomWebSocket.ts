import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export function useClassroomWebSocket(
    classroomId: string | null | undefined,
    onUpdateReceived: () => void
) {
    const clientRef = useRef<Client | null>(null);
    const VITE_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:8080";
    useEffect(() => {
        if (!classroomId) return;

        // 1. Configure the STOMP Client
        const client = new Client({
            // We use SockJS as the transport mechanism to match Spring Boot's config
            webSocketFactory: () => new SockJS(`${VITE_BASE_URL}/ws-endpoint`),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,

            onConnect: () => {
                console.log(`Connected to WebSocket for classroom: ${classroomId}`);

                // 2. Subscribe to the specific classroom topic
                client.subscribe(`/topic/classrooms/${classroomId}`, (message) => {
                    if (message.body) {
                        console.log("WebSocket Ping Received!", JSON.parse(message.body));

                        // 3. Trigger the callback function (this will fetch fresh data)
                        onUpdateReceived();
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker reported error: ' + frame.headers['message']);
            },
        });

        // Activate the connection
        client.activate();
        clientRef.current = client;

        // Cleanup: Disconnect when the component unmounts or classroomId changes
        return () => {
            if (clientRef.current) {
                clientRef.current.deactivate();
            }
        };
    }, [classroomId, onUpdateReceived]);
}