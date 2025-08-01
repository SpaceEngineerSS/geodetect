import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

// Backend sunucumuzun adresi
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.PROD ? 'https://geodetect-server.onrender.com' : 'http://localhost:3001');

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Yeni bir socket bağlantısı oluştur
        const newSocket = io(SERVER_URL);
        setSocket(newSocket);

        // Bileşen unmount edildiğinde bağlantıyı temizle
        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
