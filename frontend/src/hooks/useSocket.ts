import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3000';

let socketInstance: Socket | null = null;

export function useSocket(groupId?: string) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        const connectSocket = async () => {
            const token = await SecureStore.getItemAsync('accessToken');
            if (!token) return;

            if (!socketInstance || !socketInstance.connected) {
                socketInstance = io(`${SOCKET_URL}/chat`, {
                    auth: { token },
                    transports: ['websocket'],
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionAttempts: 5,
                });
            }

            socketRef.current = socketInstance;

            if (groupId && socketInstance.connected) {
                const userId = await SecureStore.getItemAsync('userId');
                socketInstance.emit('join-group', { groupId, userId });
            }
        };

        connectSocket();

        return () => {
            if (groupId && socketRef.current) {
                socketRef.current.emit('leave-group', { groupId });
            }
        };
    }, [groupId]);

    const emit = useCallback((event: string, data: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    const on = useCallback((event: string, callback: (...args: any[]) => void) => {
        socketRef.current?.on(event, callback);
        return () => { socketRef.current?.off(event, callback); };
    }, []);

    return { socket: socketRef.current, emit, on };
}
