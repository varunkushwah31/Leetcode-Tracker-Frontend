import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';

function getBrokerUrl(): string {
    const rawBase = import.meta.env.VITE_BASE_URL;
    if (rawBase && typeof rawBase === 'string') {
        try {
            const url = new URL(rawBase);
            const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${url.host}/ws-endpoint`;
        } catch {
            const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
            const cleanHost = rawBase.replace(/^https?:\/\//, '');
            return `${isHttps ? 'wss' : 'ws'}://${cleanHost}/ws-endpoint`;
        }
    }
    if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws-endpoint`;
    }
    return 'ws://localhost:8080/ws-endpoint';
}

export function useClassroomWebSocket(
    classroomId: string | null | undefined,
    onUpdateReceived: () => void
) {
    const clientRef = useRef<Client | null>(null);
    const callbackRef = useRef(onUpdateReceived);

    useEffect(() => {
        callbackRef.current = onUpdateReceived;
    }, [onUpdateReceived]);

    useEffect(() => {
        if (!classroomId) return;

        const token = localStorage.getItem('accessToken');
        const brokerURL = getBrokerUrl();

        // 1. Configure the STOMP Client with native WebSocket
        const client = new Client({
            brokerURL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

            onConnect: () => {
                // 2. Subscribe to the specific classroom topic
                client.subscribe(`/topic/classrooms/${classroomId}`, (message) => {
                    if (message.body) {
                        // 3. Trigger the callback function (this will fetch fresh data)
                        callbackRef.current();
                    }
                });
            },
            onStompError: (frame) => {
                console.warn('STOMP broker reported error: ', frame.headers['message']);
            },
            onWebSocketError: (event) => {
                console.warn('WebSocket connection error: ', event);
            },
        });

        // Activate the connection
        client.activate();
        clientRef.current = client;

        // Cleanup: Disconnect when the component unmounts or classroomId changes
        return () => {
            if (clientRef.current) {
                void clientRef.current.deactivate();
            }
        };
    }, [classroomId]);
}
