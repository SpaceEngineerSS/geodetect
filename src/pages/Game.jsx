import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents, Popup } from 'react-leaflet';
import { getRandomStreetViewLocation } from '../services/streetViewService';
import { reverseGeocode } from '../services/geocodingService';
import L from 'leaflet';
import CountUp from 'react-countup';
import { usePlayerStats } from '../context/PlayerStatsContext';
import { useSocket } from '../context/SocketContext';
import {
  Button, Modal, Title, Text, Stack, Paper, SimpleGrid, Center,
  LoadingOverlay, Group, RingProgress, Box, Loader, Table, Skeleton,
  Avatar, Badge, Flex, Grid,
} from '@mantine/core';
import { useDisclosure, useInterval } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconCrown, IconX } from '@tabler/icons-react';

// Ikon tanımlamaları
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const actualMarkerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const worldBounds = L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180));
const playerMarkerColors = ['blue', 'red', 'gold', 'violet', 'orange', 'grey', 'black', 'yellow'];

const getPlayerMarkerIcon = (index) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${playerMarkerColors[index % playerMarkerColors.length]}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});


function ResultMap({ results, actualLocation }) {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
            if (actualLocation && results?.length > 0) {
                const points = results.filter(r => r.guess).map(r => r.guess);
                points.push(actualLocation);
                if (points.length > 0) {
                    const bounds = L.latLngBounds(points);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }
            } else if (actualLocation) {
                 map.setView(actualLocation, 5);
            }
        }, 200);
    }, [results, actualLocation, map]);

    return (
        <>
            {actualLocation && <Marker position={actualLocation} icon={actualMarkerIcon}><Popup>Gerçek Konum</Popup></Marker>}
            {results && results.map((result, index) => (
                result.guess && (
                    <Marker key={result.playerId} position={result.guess} icon={getPlayerMarkerIcon(index)}>
                        <Popup>{result.username}</Popup>
                    </Marker>
                )
            ))}
            {actualLocation && results && results.map(result => (
                result.guess && <Polyline key={`line-${result.playerId}`} positions={[result.guess, actualLocation]} color="red" weight={2} opacity={0.7} />
            ))}
        </>
    );
}

const PlayerList = ({ players = [], hostId = null, ownId = null }) => {
  return (
    <Paper withBorder p="md" style={{ height: '100%' }}>
      <Title order={5} mb="sm">Oyuncular ({players.length})</Title>
      <Stack gap="xs">
        {players.sort((a, b) => b.score - a.score).map(player => (
          <Paper key={player.id} withBorder p="xs" radius="sm">
            <Group justify="space-between">
              <Group gap="xs">
                <Avatar src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${player.username}`} size="sm" />
                <Text size="sm" fw={player.id === ownId ? 700 : 400}>
                  {player.username} {player.id === hostId && '👑'}
                </Text>
              </Group>
              <Group gap="xs">
                 <Text size="sm" c="dimmed">{player.score}</Text>
                 {player.hasGuessed ? <IconCheck color='teal' size={16} /> : <IconX color='gray' size={16} />}
              </Group>
            </Group>
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
};


const Game = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams();
    const socket = useSocket();

    const isMultiplayer = !!roomId;
    
    const [gameSettings, setGameSettings] = useState(() => isMultiplayer ? null : (location.state?.gameSettings || { rounds: 5, timeLimit: null, gameMode: 'fixed', region: 'world' }));
    const { addXp, unlockAchievement } = usePlayerStats();
    
    const [gameMode] = useState(isMultiplayer ? 'multiplayer' : 'singleplayer');
    const [currentRound, setCurrentRound] = useState(0);
    const [totalRounds, setTotalRounds] = useState(isMultiplayer ? 0 : gameSettings.rounds);
    const [players, setPlayers] = useState([]);
    const [hostId, setHostId] = useState(null);

    const [currentLocation, setCurrentLocation] = useState(null);
    const [guessPosition, setGuessPosition] = useState(null);
    
    const [score, setScore] = useState(0);
    const [previousScore, setPreviousScore] = useState(0);
    const [roundHistory, setRoundHistory] = useState([]);
    
    const [roundResult, setRoundResult] = useState(null);
    const [finalScores, setFinalScores] = useState([]);
    const [gameOver, setGameOver] = useState(false);

    const [resultModalOpened, { open: openResultModal, close: closeResultModal }] = useDisclosure(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(true);
    const [timeLeft, setTimeLeft] = useState(isMultiplayer ? null : gameSettings.timeLimit);
    const interval = useInterval(() => setTimeLeft((t) => t > 0 ? t - 1 : 0), 1000);

    const panoramaRef = useRef(null);
    const mapRef = useRef(null);

    // Multiplayer useEffect
    useEffect(() => {
        if (!isMultiplayer || !socket) return;
        
        if(location.state?.initialRoundData) {
            const initialData = location.state.initialRoundData;
            setGameSettings(initialData.gameSettings);
            setCurrentRound(initialData.round);
            setTotalRounds(initialData.totalRounds);
            setCurrentLocation(initialData.location);
            setPlayers(initialData.players);
            if(initialData.gameSettings.timeLimit) {
                setTimeLeft(initialData.gameSettings.timeLimit);
                interval.start();
            }
            setIsLoadingLocation(false);
        }

        const handleRoomUpdate = (updatedRoom) => {
            setPlayers(updatedRoom.players);
            setHostId(updatedRoom.host);
            setGameSettings(updatedRoom.settings);
        }

        const handleNewRound = (data) => {
            closeResultModal();
            setRoundResult(null);
            setCurrentLocation(data.location);
            setCurrentRound(data.round);
            setTotalRounds(data.totalRounds);
            setPlayers(data.players);
            setGuessPosition(null);
            setIsLoadingLocation(false);
            
            if(data.gameSettings?.timeLimit) {
                setTimeLeft(data.gameSettings.timeLimit);
                interval.start();
            } else {
                interval.stop();
                setTimeLeft(null);
            }
        };

        const handleRoundResult = (data) => {
            if (gameSettings?.timeLimit) interval.stop();
            setRoundResult(data);
            setPlayers(data.playerScores);
            openResultModal();
        };

        const handleGameOver = (data) => {
            setFinalScores(data.players);
            setGameOver(true);
            closeResultModal();
        };

        socket.on('roomUpdate', handleRoomUpdate);
        socket.on('newRound', handleNewRound);
        socket.on('roundResult', handleRoundResult);
        socket.on('gameOver', handleGameOver);
        
        return () => {
            socket.off('roomUpdate', handleRoomUpdate);
            socket.off('newRound', handleNewRound);
            socket.off('roundResult', handleRoundResult);
            socket.off('gameOver', handleGameOver);
        };
    }, [isMultiplayer, socket, roomId, closeResultModal, navigate, gameSettings]);

    // Single Player Start Logic
    useEffect(() => {
        if (gameMode === 'singleplayer' && currentRound === 0) {
             setCurrentRound(1);
             startNewRound();
        }
    }, [gameMode, currentRound]);


    const startNewRound = useCallback(async () => {
        if (gameMode === 'multiplayer') return;

        setIsLoadingLocation(true);
        setGuessPosition(null);
        closeResultModal();
        if (gameSettings.timeLimit) {
            setTimeLeft(gameSettings.timeLimit);
            interval.start();
        }
        
        try {
            const loc = await getRandomStreetViewLocation(gameSettings.region);
            setCurrentLocation(loc);
        } catch (error) {
            notifications.show({ title: 'Hata', message: 'Konum bulunamadı, ana menüye yönlendiriliyorsunuz.', color: 'red' });
            navigate('/');
        } finally {
            setIsLoadingLocation(false);
        }
    }, [gameMode, closeResultModal, gameSettings, navigate, interval]);

    useEffect(() => {
        document.title = totalRounds > 0 ? `GeoDetect - Tur ${currentRound} / ${totalRounds}` : 'GeoDetect';
    }, [currentRound, totalRounds]);

    useEffect(() => {
        if (!isLoadingLocation && mapRef.current) {
            setTimeout(() => { mapRef.current.invalidateSize() }, 100);
        }
    }, [isLoadingLocation]);
    
    useEffect(() => {
        if (currentLocation && panoramaRef.current && !isLoadingLocation) {
          new window.google.maps.StreetViewPanorama( panoramaRef.current, { position: currentLocation, pov: { heading: 34, pitch: 10 }, visible: true, showRoadLabels: false, disableDefaultUI: true, clickToGo: gameSettings?.gameMode === 'moving' } );
        }
      }, [currentLocation, isLoadingLocation, gameSettings?.gameMode]);
    
    useEffect(() => {
        if (gameSettings?.timeLimit && timeLeft === 0) {
            interval.stop();
            handleGuess(true);
        }
    }, [timeLeft, interval, gameSettings?.timeLimit]);


    const handleGuess = async (force = false) => {
        const ownPlayer = isMultiplayer ? players.find(p => p.id === socket.id) : null;
        if (!currentLocation || (isMultiplayer && ownPlayer?.hasGuessed)) return;

        if (!guessPosition && !force) {
            notifications.show({ title: 'Eksik İşlem', message: 'Lütfen haritadan bir yer seçin.', color: 'yellow' });
            return;
        }
        
        const finalGuess = guessPosition || { lat: 0, lng: 0 };

        if (gameMode === 'multiplayer') {
            if (socket) {
                 socket.emit('playerGuess', { roomId, guess: finalGuess });
                 notifications.show({title: "Tahmininiz Gönderildi", message: "Diğer oyuncular bekleniyor...", color: 'blue'});
            }
            return;
        }
        
        // --- Single player logic ---
        if (gameSettings?.timeLimit) interval.stop();
        openResultModal();

        const distance = haversineDistance(finalGuess, currentLocation);
        const points = calculateScore(distance);
        
        // Fetch location names for single player
        const [guessName, actualName] = await Promise.all([
            reverseGeocode(finalGuess),
            reverseGeocode(currentLocation)
        ]);

        const spResult = {
            results: [{
                playerId: 'singleplayer',
                username: 'Siz',
                guess: finalGuess,
                distance,
                points,
                guessName,
                round: currentRound
            }],
            actualLocation: currentLocation,
            actualLocationName: actualName
        };

        setRoundResult(spResult);
        setRoundHistory([...roundHistory, spResult.results[0]]);
        setPreviousScore(score);
        setScore(prevScore => prevScore + points);

        addXp(Math.floor(points / 10));
        unlockAchievement('firstGuess');
        if (points >= 4950) unlockAchievement('perfectScore');
        if (distance <= 1) unlockAchievement('closeCall');
    };

    const handleNextRound = () => {
        if (currentRound < totalRounds) {
            setCurrentRound(r => r + 1);
            startNewRound();
        } else {
            const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
            highScores.push({ score, date: new Date().toISOString() });
            highScores.sort((a, b) => b.score - a.score);
            localStorage.setItem('highScores', JSON.stringify(highScores.slice(0, 5)));
            setFinalScores([{username: 'Siz', score}]);
            setGameOver(true);
            closeResultModal();
        }
    };
    
    const haversineDistance = (c1, c2) => {
        if(!c1 || !c2) return 0;
        const toRad = (x) => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(c2.lat - c1.lat);
        const dLon = toRad(c2.lng - c1.lng);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };
    const calculateScore = (d) => d > 20000 ? 0 : Math.round(5000 * Math.exp(-d / 1500));
    
    const handleReturnToMenu = () => {
        if (window.confirm('Oyundan çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecek.')) {
            if (isMultiplayer && socket) {
                socket.disconnect();
            }
            navigate('/');
        }
    };
    const MapEvents = () => {
        const ownPlayer = isMultiplayer ? players.find(p => p.id === socket.id) : null;
        useMapEvents({ click: (e) => !resultModalOpened && !(isMultiplayer && ownPlayer?.hasGuessed) && setGuessPosition(e.latlng) });
        return null;
    };

    if (gameOver) {
        const podium = finalScores.slice(0, 3);
        const others = finalScores.slice(3);
        
        return (
            <Center style={{ minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
                <Paper shadow="xl" p="xl" withBorder radius="md" style={{width: '100%', maxWidth: '800px'}}>
                    <Stack align="center" gap="lg">
                        <Title order={1} style={{ fontSize: '3rem' }}>Oyun Bitti!</Title>
                        
                        <Grid justify="center" align="flex-end" gutter="md" my="lg">
                           {podium[1] && <PodiumPlace player={podium[1]} place={2} />}
                           {podium[0] && <PodiumPlace player={podium[0]} place={1} />}
                           {podium[2] && <PodiumPlace player={podium[2]} place={3} />}
                        </Grid>

                        {(others.length > 0 || isMultiplayer) && (
                            <>
                                <Title order={4} mt="xl">Skor Tablosu</Title>
                                <Table withTableBorder withColumnBorders striped>
                                    <Table.Thead>
                                        <Table.Tr><Table.Th>#</Table.Th><Table.Th>Oyuncu</Table.Th><Table.Th>Puan</Table.Th></Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {finalScores.map((player, index) => (
                                            <Table.Tr key={player.id || player.username}>
                                                <Table.Td>{index + 1}</Table.Td>
                                                <Table.Td>{player.username}</Table.Td>
                                                <Table.Td>{player.score}</Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </>
                        )}
                        <Button onClick={() => navigate('/')} size="lg" mt="md" fullWidth>Ana Menüye Dön</Button>
                    </Stack>
                </Paper>
            </Center>
        );
    }
    
    return (
        <Flex gap="md" p="md" style={{ height: 'calc(100vh - 60px)' }}>
            {isMultiplayer && (
              <Box style={{width: '300px', flexShrink: 0}}>
                <PlayerList players={players} hostId={hostId} ownId={socket?.id} />
              </Box>
            )}
            <Stack style={{ flex: 1, height: '100%' }} gap="md">
                <Paper withBorder p="xs" shadow="xs">
                    <Group justify="space-between" align="center">
                        <Button variant="outline" color="red" size="xs" onClick={handleReturnToMenu}>Ana Menü</Button>
                        <Group>
                          <Text>Tur: {currentRound} / {totalRounds}</Text>
                          {gameMode === 'singleplayer' && <Text fw={700}>Puan: <CountUp start={previousScore} end={score} duration={1} /></Text>}
                        </Group>
                        {gameSettings?.timeLimit && (
                            <Group gap="xs" align="center">
                                <Text>Süre:</Text>
                                <RingProgress
                                    size={45}
                                    thickness={4}
                                    roundCaps
                                    sections={[{ value: (timeLeft / gameSettings.timeLimit) * 100, color: timeLeft > gameSettings.timeLimit * 0.5 ? 'teal' : timeLeft > gameSettings.timeLimit * 0.2 ? 'yellow' : 'red' }]}
                                    label={<Center><Text size="xs" fw={700} className={timeLeft <= gameSettings.timeLimit * 0.2 && timeLeft !== null ? 'pulse-red' : ''}>{timeLeft}</Text></Center>}
                                />
                            </Group>
                        )}
                    </Group>
                </Paper>
                <Box style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Paper withBorder radius="md" style={{ position: 'relative' }}>
                        <LoadingOverlay visible={isLoadingLocation} overlayProps={{ radius: "md", blur: 2 }} />
                        <div ref={panoramaRef} style={{ height: '100%', width: '100%', borderRadius: 'var(--mantine-radius-md)' }}></div>
                         <Box style={{ position: 'absolute', bottom: 0, left: 0, height: '20px', width: '80px', zIndex: 1000 }} />
                    </Paper>
                    <Paper withBorder radius="md" style={{ position: 'relative' }}>
                        <MapContainer whenCreated={mapInstance => { mapRef.current = mapInstance }} center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%', borderRadius: 'var(--mantine-radius-md)' }} maxBounds={worldBounds} minZoom={2}>
                            <TileLayer noWrap={true} url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                            {guessPosition && <Marker position={guessPosition}></Marker>}
                            <MapEvents />
                        </MapContainer>
                         <Button 
                            onClick={() => handleGuess(false)} 
                            disabled={!guessPosition || isLoadingLocation || (isMultiplayer && players.find(p => p.id === socket.id)?.hasGuessed)}
                            size="lg" 
                            style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 401 }}>
                            {(isMultiplayer && players.find(p => p.id === socket.id)?.hasGuessed) ? 'Tahmin Gönderildi' : 'Tahmin Et'}
                        </Button>
                    </Paper>
                </Box>
            </Stack>

            <Modal opened={resultModalOpened} onClose={() => {}} title={roundResult ? `Tur ${isMultiplayer ? roundResult.round + 1 : currentRound} Sonucu` : 'Tur Sonucu'} centered withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} size="80%" zIndex={2000}>
               {roundResult && (
                 <Stack>
                    <Title order={3} ta="center">Gerçek Konum: {roundResult.actualLocationName}</Title>
                    <Box style={{ height: '40vh', width: '100%' }}>
                         <MapContainer center={[20, 0]} zoom={1} style={{ height: '100%', width: '100%' }} maxBounds={worldBounds} minZoom={1}>
                            <TileLayer noWrap={true} url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'/>
                            <ResultMap results={roundResult.results} actualLocation={roundResult.actualLocation} />
                        </MapContainer>
                    </Box>
                    <Table withTableBorder withColumnBorders striped>
                      <Table.Thead>
                          <Table.Tr>
                              <Table.Th>#</Table.Th>
                              <Table.Th>Oyuncu</Table.Th>
                              <Table.Th>Tahmin Edilen Yer</Table.Th>
                              <Table.Th>Mesafe (km)</Table.Th>
                              <Table.Th>Puan</Table.Th>
                          </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                          {roundResult.results.map((res, index) => (
                            <Table.Tr key={res.playerId} style={{backgroundColor: res.playerId === socket?.id || res.playerId === 'singleplayer' ? 'var(--mantine-color-blue-light)' : 'transparent'}}>
                               <Table.Td>{index + 1}</Table.Td>
                               <Table.Td>{res.username}</Table.Td>
                               <Table.Td>{res.guessName}</Table.Td>
                               <Table.Td>{res.distance < 9999 ? `${res.distance.toFixed(2)}` : 'Tahmin Yok'}</Table.Td>
                               <Table.Td><CountUp end={res.points} duration={1} /></Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                    {gameMode === 'singleplayer' ? (
                        <Button onClick={handleNextRound} size="md" fullWidth>
                            {currentRound < totalRounds ? 'Sonraki Tur' : 'Sonuçları Gör'}
                        </Button>
                    ) : (
                        <Center mt="md">
                            <Group gap="xs">
                                <Loader size="xs" />
                                <Text>Sonraki tur başlıyor...</Text>
                            </Group>
                        </Center>
                    )}
                </Stack>
               )}
            </Modal>
        </Flex>
    );
};

const PodiumPlace = ({ player, place }) => {
    const places = {
        1: { color: 'yellow', size: '150px', iconSize: 40 },
        2: { color: 'gray.5', size: '120px', iconSize: 30 },
        3: { color: '#C5793D', size: '100px', iconSize: 20 },
    };
    const current = places[place];

    return (
        <Grid.Col span={4}>
            <Stack align="center" gap={0}>
                {place === 1 && <IconCrown color={current.color} size={current.iconSize} style={{marginBottom: '5px'}}/>}
                <Avatar src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${player.username}`} size="xl" />
                <Text fw={700} size="lg">{player.username}</Text>
                <Text c="dimmed">{player.score} Puan</Text>
                <Paper withBorder radius="sm" p={0} style={{width: '100%', height: current.size, backgroundColor: `var(--mantine-color-${current.color}-light)`}}>
                    <Center style={{height: '100%'}}>
                        <Title style={{fontSize: '5rem', color: `var(--mantine-color-${current.color}-filled)`}}>{place}</Title>
                    </Center>
                </Paper>
            </Stack>
        </Grid.Col>
    )
}

export default Game;
