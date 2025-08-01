const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
const { getRandomStreetViewLocation } = require('./services/streetViewService');
const { reverseGeocode } = require('./services/geocodingService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://geodetect.vercel.app", "https://geodetect-game.vercel.app"] 
      : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const authRoutes = require('./routes/auth');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://geodetect.vercel.app", "https://geodetect-game.vercel.app"] 
    : "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('GeoDetect Sunucusu Çalışıyor!');
});

const rooms = {};
const roomTimers = {};

// --- Helper Functions ---
const haversineDistance = (c1, c2) => {
    if (!c1 || !c2) return 99999;
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(c2.lat - c1.lat);
    const dLon = toRad(c2.lng - c1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const calculateScore = (d) => d > 20000 ? 0 : Math.round(5000 * Math.exp(-d / 1500));

const cleanupRoom = (roomId) => {
    if (roomTimers[roomId]) {
        clearTimeout(roomTimers[roomId]);
        delete roomTimers[roomId];
    }
    delete rooms[roomId];
    console.log(`[CLEANUP] Oda silindi: ${roomId}`);
}

// --- Socket.IO Logic ---
io.on('connection', (socket) => {
    console.log(`[CONNECTION] User connected: ${socket.id}`);

    const leaveAllRooms = () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) {
                leaveRoom(roomId);
            }
        }
    }

    const leaveRoom = (roomId) => {
        const room = rooms[roomId];
        if (!room) return;

        const wasPlaying = room.gameState.state === 'playing';
        room.players = room.players.filter(p => p.id !== socket.id);
        console.log(`[LEAVE] User ${socket.id} left room ${roomId}`);

        if (room.players.length === 0) {
            cleanupRoom(roomId);
            return;
        }

        if (room.host === socket.id) {
            room.host = room.players[0].id;
            console.log(`[HOST CHANGE] New host for room ${roomId}: ${room.host}`);
        }

        io.to(roomId).emit('roomUpdate', room);

        if (wasPlaying && !room.gameState.isFinishing && room.players.every(p => p.hasGuessed)) {
            finishRound(roomId);
        }
    }

    socket.on('createRoom', ({ settings, player }) => {
        leaveAllRooms();
        const roomId = crypto.randomBytes(3).toString('hex').toUpperCase();
        rooms[roomId] = {
            id: roomId,
            settings: { rounds: 5, timeLimit: null, gameMode: 'moving', region: 'world', ...settings },
            players: [{ ...player, id: socket.id, score: 0, roundData: {}, hasGuessed: false }],
            host: socket.id,
            gameState: { state: 'waiting', currentRound: 0, locations: [], isFinishing: false },
        };
        socket.join(roomId);
        io.to(roomId).emit('roomUpdate', rooms[roomId]);
        socket.emit('roomCreated', roomId);
    });

    socket.on('joinRoom', ({ roomId, player }) => {
        const room = rooms[roomId];
        if (!room) return socket.emit('error', 'Oda bulunamadı.');

        if (room.players.some(p => p.id === socket.id)) {
            socket.join(roomId);
            socket.emit('roomUpdate', room);
            return;
        }

        if (room.gameState.state !== 'waiting') return socket.emit('error', 'Oyun çoktan başlamış.');
        if (room.players.length >= 8) return socket.emit('error', 'Oda dolu.');

        leaveAllRooms();

        room.players.push({ ...player, id: socket.id, score: 0, roundData: {}, hasGuessed: false });
        socket.join(roomId);
        io.to(roomId).emit('roomUpdate', room);
    });

    socket.on('updateSettings', ({ roomId, newSettings }) => {
        const room = rooms[roomId];
        if (room && room.host === socket.id) {
            const validSettings = {
                rounds: Math.max(1, Math.min(20, parseInt(newSettings.rounds, 10) || room.settings.rounds)),
                timeLimit: [null, 60, 180, 300].includes(newSettings.timeLimit) ? newSettings.timeLimit : room.settings.timeLimit,
                gameMode: ['moving', 'fixed'].includes(newSettings.gameMode) ? newSettings.gameMode : room.settings.gameMode,
                region: ['world', 'europe', 'asia', 'africa', 'north_america', 'south_america', 'oceania'].includes(newSettings.region) ? newSettings.region : room.settings.region,
            };
            room.settings = { ...room.settings, ...validSettings };
            io.to(roomId).emit('roomUpdate', room);
        }
    });

    socket.on('startGame', async (roomId) => {
        const room = rooms[roomId];
        if (room && room.host === socket.id) {
            try {
                room.gameState.state = 'playing';
                io.to(roomId).emit('gameLoading');
                const locationPromises = Array.from({ length: room.settings.rounds }, () => getRandomStreetViewLocation(room.settings.region));
                room.gameState.locations = await Promise.all(locationPromises);
                startNewRound(roomId);
            } catch (error) {
                console.error(`[FATAL ERROR] startGame for room ${roomId}:`, error);
                room.gameState.state = 'waiting';
                io.to(roomId).emit('roomUpdate', room);
                io.to(roomId).emit('error', `Oyun başlatılamadı: Konumlar alınamadı.`);
            }
        }
    });

    socket.on('playerGuess', ({ roomId, guess }) => {
        const room = rooms[roomId];
        const player = room?.players.find(p => p.id === socket.id);
        if (room && player && room.gameState.state === 'playing' && !room.gameState.isFinishing && !player.hasGuessed) {
            player.hasGuessed = true;
            const currentLocation = room.gameState.locations[room.gameState.currentRound - 1];
            player.roundData = {
                guess,
                distance: haversineDistance(currentLocation, guess),
                points: calculateScore(haversineDistance(currentLocation, guess))
            };
            io.to(roomId).emit('roomUpdate', room);
            if (room.players.every(p => p.hasGuessed)) {
                finishRound(roomId);
            }
        }
    });

    const startNewRound = (roomId) => {
        const room = rooms[roomId];
        if (!room) return;
        room.gameState.isFinishing = false;
        room.gameState.currentRound++;
        if (room.gameState.currentRound > room.settings.rounds) {
            finishGame(roomId);
            return;
        }
        room.players.forEach(p => {
            p.hasGuessed = false;
            p.roundData = {};
        });
        io.to(roomId).emit('newRound', {
            round: room.gameState.currentRound,
            totalRounds: room.settings.rounds,
            location: room.gameState.locations[room.gameState.currentRound - 1],
            players: room.players,
            gameSettings: room.settings
        });
        if (room.settings.timeLimit) {
            if (roomTimers[roomId]) clearTimeout(roomTimers[roomId]);
            roomTimers[roomId] = setTimeout(() => finishRound(roomId), room.settings.timeLimit * 1000);
        }
    };

    const finishRound = async (roomId) => {
        const room = rooms[roomId];
        if (!room || room.gameState.state !== 'playing' || room.gameState.isFinishing) return;
        
        room.gameState.isFinishing = true;
        if (roomTimers[roomId]) {
            clearTimeout(roomTimers[roomId]);
            delete roomTimers[roomId];
        }

        const currentLocation = room.gameState.locations[room.gameState.currentRound - 1];
        const actualLocationName = await reverseGeocode(currentLocation);

        const roundResults = [];
        for (const player of room.players) {
            player.score += player.roundData.points || 0;
            const guessName = await reverseGeocode(player.roundData.guess);
            roundResults.push({
                playerId: player.id,
                username: player.username,
                guessName,
                ...player.roundData
            });
        }
        
        roundResults.sort((a, b) => a.distance - b.distance);
        
        const playerScores = room.players
            .map(p => ({ id: p.id, score: p.score, username: p.username }))
            .sort((a, b) => b.score - a.score);

        const roundNumber = room.gameState.currentRound - 1;
        io.to(roomId).emit('roundResult', {
            results: roundResults,
            actualLocation: currentLocation,
            actualLocationName,
            playerScores: playerScores,
            round: roundNumber
        });

        const waitTime = 15000;

        // Bir sonraki adıma karar ver
        if (room.gameState.currentRound >= room.settings.rounds) {
            // Bu son turdu, oyunu bitir
            setTimeout(() => finishGame(roomId), waitTime);
        } else {
            // Sonraki tura geç
            setTimeout(() => startNewRound(roomId), waitTime);
        }
    };

    const finishGame = (roomId) => {
        const room = rooms[roomId];
        if (!room) return;
        if (roomTimers[roomId]) {
            clearTimeout(roomTimers[roomId]);
            delete roomTimers[roomId];
        }
        room.gameState.state = 'finished';
        io.to(roomId).emit('gameOver', {
            players: room.players.sort((a, b) => b.score - a.score)
        });
        setTimeout(() => cleanupRoom(roomId), 60000);
    };
    
    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) leaveRoom(roomId);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[DISCONNECT] User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`GeoDetect Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
