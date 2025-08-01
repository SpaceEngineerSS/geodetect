import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { UserProvider } from './context/UserContext';
import { PlayerStatsProvider } from './context/PlayerStatsContext';
import { SocketProvider } from './context/SocketContext';
import App from './App';

import './index.css';
import 'leaflet/dist/leaflet.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <BrowserRouter>
        <SocketProvider>
          <UserProvider>
            <PlayerStatsProvider>
              <Notifications />
              <App />
            </PlayerStatsProvider>
          </UserProvider>
        </SocketProvider>
      </BrowserRouter>
    </MantineProvider>
  </React.StrictMode>
);
