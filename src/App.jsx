import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { AppShell, Burger, Group, Title, Center, Loader, UnstyledButton, Avatar, Text, Modal, TextInput, SimpleGrid, Image, Button, Stack, Progress, Box, PasswordInput, Alert } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle, IconInfoCircle } from '@tabler/icons-react';
import { Loader as GoogleApiLoader } from '@googlemaps/js-api-loader';
import { useUser } from './context/UserContext';
import { usePlayerStats } from './context/PlayerStatsContext';

import Game from './pages/Game';
import MainMenu from './pages/MainMenu';
import MultiplayerLobby from './pages/MultiplayerLobby';
import WaitingRoom from './pages/WaitingRoom';
import AchievementsPage from './pages/AchievementsPage';
import StatsPage from './pages/StatsPage';

// --- Bileşenler ---

const AuthModal = ({ opened, close, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'signup'
    const [error, setError] = useState('');
    const { login, signup } = useUser();

    const form = useForm({
        initialValues: { email: '', password: '', username: '' },
        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Geçersiz e-posta'),
            password: (value) => (mode === 'signup' && value.length < 6 ? 'Şifre en az 6 karakter olmalı' : null),
            username: (value) => (mode === 'signup' && value.trim().length < 3 ? 'Kullanıcı adı en az 3 karakter olmalı' : null),
        },
    });

    const handleSubmit = async (values) => {
        setError('');
        try {
            if (mode === 'login') {
                await login(values.email, values.password);
            } else {
                await signup(values.email, values.password, values.username);
                notifications.show({
                    title: 'Kayıt Başarılı!',
                    message: 'Hesabınızı doğrulamak için lütfen e-postanızı kontrol edin.',
                    color: 'green'
                });
            }
            close();
            form.reset();
        } catch (err) {
            setError(err.message || 'Bir hata oluştu.');
        }
    };

    return (
        <Modal opened={opened} onClose={() => { close(); form.reset(); setError(''); }} title={mode === 'login' ? "Giriş Yap" : "Kayıt Ol"} centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack>
                    {mode === 'signup' && (
                        <TextInput label="Kullanıcı Adı" placeholder="Kullanıcı adınız" {...form.getInputProps('username')} required />
                    )}
                    <TextInput label="E-posta" placeholder="E-posta adresiniz" {...form.getInputProps('email')} required />
                    <PasswordInput label="Şifre" placeholder="Şifreniz" {...form.getInputProps('password')} required />

                    {error && <Alert icon={<IconAlertCircle size="1rem" />} title="Hata!" color="red" variant="light">{error}</Alert>}

                    <Button type="submit" loading={form.isSubmitting}>{mode === 'login' ? "Giriş Yap" : "Kayıt Ol"}</Button>
                    <Text ta="center" size="sm">
                        {mode === 'login' ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
                        <UnstyledButton onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} c="blue">
                            {mode === 'login' ? "Kayıt Ol" : "Giriş Yap"}
                        </UnstyledButton>
                    </Text>
                </Stack>
            </form>
        </Modal>
    );
};


// --- Ana Uygulama ---

function App() {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const [googleApiError, setGoogleApiError] = useState(false);
  const { session, profile, logout } = useUser();
  const { rank, level, xp, xpToNextLevel } = usePlayerStats();
  
  const [authModalOpened, { open: openAuthModal, close: closeAuthModal }] = useDisclosure(false);
  const [authMode, setAuthMode] = useState('login');

  const handleOpenAuthModal = (mode) => {
    setAuthMode(mode);
    openAuthModal();
  }
  
  useEffect(() => {
    const loader = new GoogleApiLoader({ apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY, version: "weekly" });
    loader.load().then(() => setGoogleApiLoaded(true)).catch(e => setGoogleApiError(true));
  }, []);

  if (googleApiError) return (
    <Center h="100vh">
      <Stack align="center" spacing="md">
        <Title color="red">Harita Servisleri Yüklenemedi</Title>
        <Text size="sm" c="dimmed">Lütfen internet bağlantınızı kontrol edin ve sayfayı yenileyin.</Text>
      </Stack>
    </Center>
  );
  
  if (!googleApiLoaded) return (
    <Center h="100vh">
      <Stack align="center" spacing="md">
        <Loader size="lg" />
        <Title order={3}>GeoDetect Yükleniyor...</Title>
        <Text size="sm" c="dimmed">Harita servisleri başlatılıyor, lütfen bekleyin.</Text>
        {import.meta.env.PROD && (
          <Alert icon={<IconInfoCircle size="1rem" />} title="Ücretsiz Sunucu" color="blue" variant="light" w={400}>
            Ücretsiz sunucular ilk istekte yavaş olabilir. Bu normal bir durumdur.
          </Alert>
        )}
      </Stack>
    </Center>
  );

  return (
    <>
      <AuthModal opened={authModalOpened} close={closeAuthModal} initialMode={authMode} />
      
      <AppShell
        header={{ height: 60 }}
        navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !navOpened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md">
            <Burger opened={navOpened} onClick={toggleNav} hiddenFrom="sm" size="sm" />
            <Title order={3} component={Link} to="/" style={{ textDecoration: 'none', color: 'inherit' }}>GeoDetect</Title>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
            {session && profile ? (
                <Stack>
                    <UnstyledButton>
                        <Group>
                        <Avatar src={profile.avatar_url} radius="xl" />
                        <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>{profile.username}</Text>
                            <Text c="dimmed" size="xs">{rank}</Text>
                        </div>
                        </Group>
                    </UnstyledButton>
                    <Box>
                        <Group justify="space-between"><Text size="xs">Seviye {level}</Text><Text size="xs">{xp} / {xpToNextLevel} XP</Text></Group>
                        <Progress value={(xp / xpToNextLevel) * 100} size="sm" animated />
                    </Box>
                    <Button onClick={logout} variant="light" color="red">Çıkış Yap</Button>
                </Stack>
            ) : (
                 <Stack>
                    <Button onClick={() => handleOpenAuthModal('login')} variant="default">Giriş Yap</Button>
                    <Button onClick={() => handleOpenAuthModal('signup')}>Kayıt Ol</Button>
                </Stack>
            )}
          
          <Stack mt="xl">
             <Button component={Link} to="/" variant="subtle" onClick={toggleNav}>Ana Menü</Button>
             <Button component={Link} to="/multiplayer" variant="subtle" onClick={toggleNav}>Çok Oyunculu</Button>
             {session && (
                <>
                    <Button component={Link} to="/stats" variant="subtle" onClick={toggleNav}>İstatistiklerim</Button>
                    <Button component={Link} to="/achievements" variant="subtle" onClick={toggleNav}>Başarımlar</Button>
                </>
             )}
          </Stack>

        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<MainMenu />} />
            <Route path="/game" element={<Game />} /> 
            <Route path="/game/:roomId" element={<Game />} />
            <Route path="/multiplayer" element={<MultiplayerLobby />} />
            <Route path="/multiplayer/:roomId" element={<WaitingRoom />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

export default App;
