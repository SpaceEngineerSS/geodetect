import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { 
    Paper, Title, Text, Stack, Button, SimpleGrid, Group, Badge, CopyButton, 
    Tooltip, ActionIcon, Center, Loader, Avatar, Modal, TextInput, Divider,
    NumberInput, Select, SegmentedControl
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCopy, IconCheck, IconWorld, IconLock, IconUsers } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

const regionData = [
    { value: 'world', label: 'Dünya (Rastgele)' },
    { group: 'Bölgeler', items: [
        { value: 'europe', label: 'Avrupa' },
        { value: 'asia', label: 'Asya' },
        { value: 'africa', label: 'Afrika' },
        { value: 'north_america', label: 'Kuzey Amerika' },
        { value: 'south_america', label: 'Güney Amerika' },
        { value: 'oceania', label: 'Okyanusya' },
    ]}
];

const WaitingRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const [room, setRoom] = useState(null);
 

    const [isHost, setIsHost] = useState(false);
    const [usernameModalOpened, setUsernameModalOpened] = useState(false);

    const hasJoined = useRef(false);

    const form = useForm({
        initialValues: { username: '' },
        validate: { username: (value) => (value.trim().length >= 3 && value.trim().length <= 15 ? null : 'Kullanıcı adı 3-15 karakter olmalıdır.')},
    });

    useEffect(() => {
        if (!socket) return;
        
        const savedUsername = localStorage.getItem('geodetect-username');
        if (savedUsername && !hasJoined.current) {
            hasJoined.current = true;
            socket.emit('joinRoom', { roomId, player: { username: savedUsername } });
        } else if (!savedUsername) {
            setUsernameModalOpened(true);
        }

        const handleRoomUpdate = (roomData) => {
            setRoom(roomData);
            setIsHost(socket.id === roomData.host);
        };

        const handleGameLoading = () => {
             setRoom(prev => ({...prev, gameState: {...prev.gameState, state: 'loading'}}))
        };

        const handleNewRound = (roundData) => {
            navigate(`/game/${roomId}`, { state: { initialRoundData: roundData } });
        };
        
        const handleError = (errorMessage) => {
            notifications.show({ title: 'Oda Hatası', message: errorMessage, color: 'red' });
            navigate('/multiplayer');
        };

        socket.on('roomUpdate', handleRoomUpdate);
        socket.on('gameLoading', handleGameLoading);
        socket.on('newRound', handleNewRound);
        socket.on('error', handleError);

        return () => {
            socket.off('roomUpdate');
            socket.off('gameLoading');
            socket.off('newRound');
            socket.off('error');
        };
    }, [socket, roomId, navigate]);


    useEffect(() => {
        document.title = room ? `GeoDetect - Oda: ${room.id}` : 'Odaya Katıl';
    }, [room]);


    const handleUsernameSubmit = () => {
        if (form.validate().hasErrors) return;
        const username = form.values.username;
        localStorage.setItem('geodetect-username', username);
        setUsernameModalOpened(false);
        if (!hasJoined.current) {
             hasJoined.current = true;
             socket.emit('joinRoom', { roomId, player: { username } });
        }
    };

    const handleStartGame = () => {
        if (socket && isHost) {
            socket.emit('startGame', roomId);
        }
    };

    const handleSettingsChange = (newSettings) => {
        if (socket && isHost) {
            socket.emit('updateSettings', { roomId, newSettings });
        }
    };
    
    if (usernameModalOpened) {
         return (
            <Modal opened={usernameModalOpened} onClose={() => navigate('/multiplayer')} title="Bir Kullanıcı Adı Belirle" centered withCloseButton={false} closeOnClickOutside={false}>
                <Stack>
                    <TextInput label="Kullanıcı Adı" placeholder="Görünecek adınız" data-autofocus {...form.getInputProps('username')} />
                    <Button onClick={handleUsernameSubmit}>Odaya Katıl</Button>
                </Stack>
            </Modal>
        );
    }

    if (!room) {
        return (
            <Center h="100vh">
                <Stack align="center">
                    <Loader />
                    <Text>Odaya bağlanılıyor...</Text>
                </Stack>
            </Center>
        );
    }
    
    if (room.gameState.state === 'loading') {
        return (
             <Center h="100vh">
                <Stack align="center">
                    <Loader />
                    <Title>Oyun Başlıyor!</Title>
                    <Text>Rastgele konumlar yükleniyor, lütfen bekleyin...</Text>
                </Stack>
            </Center>
        )
    }

    const timeLimitToString = (limit) => limit === null ? 'Sınırsız' : `${limit / 60} Dakika`;
    const regionToString = (regionKey) => regionData.flatMap(r => r.items || r).find(r => r.value === regionKey)?.label || 'Bilinmeyen';
    const gameModeToString = (modeKey) => modeKey === 'moving' ? 'Hareketli' : 'Sabit';

    return (
        <Center style={{ minHeight: 'calc(100vh - 120px)', padding: '20px' }}>
            <Paper withBorder p="xl" shadow="md" w={800} radius="md">
                <Stack>
                    <Group justify="space-between">
                        <Title order={2}>Bekleme Odası</Title>
                        <Group>
                            <Text>Oda Kodu:</Text>
                            <Badge size="xl" variant="light">{roomId}</Badge>
                             <CopyButton value={window.location.href}>
                                {({ copied, copy }) => (
                                    <Tooltip label={copied ? 'Kopyalandı!' : 'Davet Linkini Kopyala'} withArrow>
                                    <ActionIcon color={copied ? 'teal' : 'gray'} onClick={copy}>
                                        {copied ? <IconCheck size="1rem" /> : <IconCopy size="1rem" />}
                                    </ActionIcon>
                                    </Tooltip>
                                )}
                            </CopyButton>
                        </Group>
                    </Group>
                    
                    <Text mt="lg">Oyuncular ({room.players.length}/8):</Text>
                    <SimpleGrid cols={{ base: 2, sm: 4 }} mb="lg">
                        {room.players.map(player => (
                            <Paper withBorder p="sm" key={player.id} radius="md">
                               <Group>
                                 <Avatar src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${player.username}`} size="sm" />
                                 <Text fw={player.id === socket?.id ? 700 : 500} size="sm">{player.username}</Text>
                                 {player.id === room.host && <Badge color="yellow" variant="filled">Kurucu</Badge>}
                               </Group>
                            </Paper>
                        ))}
                    </SimpleGrid>

                    <Divider my="md" label="Ayarlar" labelPosition="center" />

                    {isHost ? (
                        <Stack>
                             <Group grow align="flex-start">
                                <Select label="Bölge" data={regionData} value={room.settings.region} onChange={(value) => handleSettingsChange({ region: value })} />
                                <NumberInput label="Tur Sayısı" value={room.settings.rounds} onChange={(value) => handleSettingsChange({ rounds: value })} min={1} max={20} />
                                <Select label="Tur Başına Süre" value={String(room.settings.timeLimit)} onChange={(value) => handleSettingsChange({ timeLimit: value === 'null' ? null : Number(value) })} data={[ { value: 'null', label: 'Sınırsız' }, { value: '60', label: '1 Dakika' }, { value: '180', label: '3 Dakika' }, { value: '300', label: '5 Dakika' }]} />
                             </Group>
                            <SegmentedControl
                                value={room.settings.gameMode}
                                onChange={(value) => handleSettingsChange({ gameMode: value })}
                                data={[
                                    { label: 'Sabit Mod', value: 'fixed' },
                                    { label: 'Hareketli Mod', value: 'moving' },
                                ]}
                                color="blue"
                                fullWidth
                            />
                             <Button onClick={handleStartGame} size="lg" mt="xl" disabled={room.players.length < 1} fullWidth>
                                Oyunu Başlat ({room.players.length} oyuncuyla)
                            </Button>
                        </Stack>
                    ) : (
                        <Stack align="center">
                            <SimpleGrid cols={2} spacing="lg">
                               <Paper withBorder p="md" radius="sm"><Stack align='center'><Text size='xs' c='dimmed'>Bölge</Text><Text>{regionToString(room.settings.region)}</Text></Stack></Paper>
                               <Paper withBorder p="md" radius="sm"><Stack align='center'><Text size='xs' c='dimmed'>Oyun Modu</Text><Text>{gameModeToString(room.settings.gameMode)}</Text></Stack></Paper>
                               <Paper withBorder p="md" radius="sm"><Stack align='center'><Text size='xs' c='dimmed'>Tur Sayısı</Text><Text>{room.settings.rounds}</Text></Stack></Paper>
                               <Paper withBorder p="md" radius="sm"><Stack align='center'><Text size='xs' c='dimmed'>Tur Süresi</Text><Text>{timeLimitToString(room.settings.timeLimit)}</Text></Stack></Paper>
                            </SimpleGrid>
                            <Text mt="xl" ta="center">Oda kurucusunun oyunu başlatması bekleniyor...</Text>
                        </Stack>
                    )}
                </Stack>
            </Paper>
        </Center>
    );
};

export default WaitingRoom;
