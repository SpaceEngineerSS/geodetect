import React, { useEffect } from 'react';
import { Title, Text, Paper, Stack, Button, TextInput, Group, Divider, Center } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

const MultiplayerLobby = () => {
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        document.title = 'GeoDetect - Çok Oyunculu Lobi';
        
        if (socket) {
            const onRoomCreated = (roomId) => navigate(`/multiplayer/${roomId}`);
            const onError = (errorMessage) => notifications.show({ title: 'Sunucu Hatası', message: errorMessage, color: 'red' });

            socket.on('roomCreated', onRoomCreated);
            socket.on('error', onError);

            return () => {
                socket.off('roomCreated', onRoomCreated);
                socket.off('error', onError);
            };
        }
    }, [socket, navigate]);

    const form = useForm({
        initialValues: {
            username: localStorage.getItem('geodetect-username') || '',
            roomCode: '',
        },
        validate: {
            username: (value) => (value.trim().length >= 3 && value.trim().length <= 15 ? null : 'Kullanıcı adı 3 ila 15 karakter arasında olmalıdır.'),
        },
    });

    const handleCreateRoom = () => {
        if (form.validateField('username').hasError) {
            notifications.show({ title: 'Geçersiz Kullanıcı Adı', message: 'Lütfen geçerli bir kullanıcı adı girin.', color: 'red' });
            return;
        }
        
        if (socket) {
            localStorage.setItem('geodetect-username', form.values.username);
            // Sunucu varsayılan ayarları kullanacak, biz sadece oyuncu bilgisini gönderiyoruz.
            socket.emit('createRoom', { 
                settings: {}, // Sunucu varsayılanları uygulayacak
                player: { username: form.values.username } 
            });
        }
    };

    const handleJoinRoom = () => {
        if (form.validate().hasErrors) return;
        
        if (form.values.roomCode.trim().length !== 6) {
            form.setFieldError('roomCode', 'Oda kodu 6 karakter olmalıdır.');
            return;
        }
        
        if (socket) {
            localStorage.setItem('geodetect-username', form.values.username);
            // Odaya katıldıktan sonra yönlendirme WaitingRoom'da handle edilecek.
            navigate(`/multiplayer/${form.values.roomCode.toUpperCase()}`);
        }
    };

    return (
        <Center style={{ height: 'calc(100vh - 120px)' }}>
            <Paper withBorder p="xl" shadow="md" w={500} radius="md">
                <Stack>
                    <Title order={2} ta="center">Çok Oyunculu</Title>
                    <Text c="dimmed" ta="center">Hızlıca bir kullanıcı adı belirle ve maceraya katıl!</Text>
                    
                    <TextInput
                        label="Kullanıcı Adı"
                        placeholder="Görünecek adınız"
                        {...form.getInputProps('username')}
                        mt="md"
                    />

                    <Divider my="lg" label="Seçenekler" labelPosition="center" />

                    <Stack>
                        <Title order={4} ta="center">Yeni Bir Oda Kur</Title>
                        <Button onClick={handleCreateRoom} fullWidth disabled={!socket}>
                            {socket ? 'Oda Kur ve Katıl' : 'Bağlanılıyor...'}
                        </Button>
                    </Stack>

                    <Divider my="lg" label="Veya" labelPosition="center" />
                    
                    <Stack>
                         <Title order={4} ta="center">Mevcut Bir Odaya Katıl</Title>
                        <TextInput
                            label="Oda Kodu"
                            placeholder="6 Haneli Kodu Girin"
                            {...form.getInputProps('roomCode')}
                            maxLength={6}
                        />
                        <Button onClick={handleJoinRoom} variant="outline" fullWidth disabled={!socket}>
                             {socket ? 'Odaya Katıl' : 'Bağlanılıyor...'}
                        </Button>
                    </Stack>
                </Stack>
            </Paper>
        </Center>
    );
};

export default MultiplayerLobby;
