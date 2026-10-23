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

export function usePvpWebSocket(
    matchIds: string[],
    onUpdateReceived: (event?: { matchId?: string; action?: string; message?: string }) => void
) {
    const clientRef = useRef<Client | null>(null);
    const callbackRef = useRef(onUpdateReceived);

    useEffect(() => {
        callbackRef.current = onUpdateReceived;
    }, [onUpdateReceived]);

    // Serialize match IDs to stabilize effect dependency
    const matchIdsKey = matchIds.filter(Boolean).sort().join(',');

    useEffect(() => {
        if (!matchIdsKey) return;
        const activeIds = matchIdsKey.split(',').filter(Boolean);
        if (activeIds.length === 0) return;

        const token = localStorage.getItem('accessToken');
        const brokerURL = getBrokerUrl();

        const client = new Client({
            brokerURL,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},

            onConnect: () => {
                activeIds.forEach((id) => {
                    client.subscribe(`/topic/pvp/${id}`, (message) => {
                        if (message.body) {
                            try {
                                const parsed = JSON.parse(message.body);
                                callbackRef.current(parsed);
                            } catch {
                                callbackRef.current({ matchId: id });
                            }
                        }
                    });
                });
            },
            onStompError: (frame) => {
                console.warn('PVP STOMP broker reported error: ', frame.headers['message']);
            },
            onWebSocketError: (event) => {
                console.warn('PVP WebSocket connection error: ', event);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (clientRef.current) {
                void clientRef.current.deactivate();
            }
        };
    }, [matchIdsKey]);
}
