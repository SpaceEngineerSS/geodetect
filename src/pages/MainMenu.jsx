import React, { useState, useEffect } from 'react';
import { Title, Button, Center, Stack, Paper, Select, NumberInput, SegmentedControl, Group } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

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

const MainMenu = () => {
  const navigate = useNavigate();
  useEffect(() => {
    document.title = 'GeoDetect - Ana Menü';
  }, []);
  const [rounds, setRounds] = useState(5);
  const [timeLimit, setTimeLimit] = useState('Sınırsız');
  const [gameMode, setGameMode] = useState('fixed');
  const [region, setRegion] = useState('world');

  const startGame = () => {
    navigate('/game', {
      state: {
        gameSettings: {
          rounds,
          timeLimit: timeLimit === 'Sınırsız' ? null : parseInt(timeLimit),
          gameMode,
          region,
        },
      },
    });
  };
  
  return (
    <Center style={{ height: 'calc(100vh - 120px)' }}>
      <Paper shadow="xl" p="xl" withBorder w={500}>
        <Stack align="center" gap="lg">
          <Title order={1}>GeoDetect'e Hoş Geldiniz!</Title>
          
          <Paper withBorder p="md" w="100%">
            <Stack>
                <Title order={4} ta="center">Tek Kişilik Oyun</Title>
                <SegmentedControl
                    value={gameMode}
                    onChange={setGameMode}
                    data={[ { label: 'Sabit Mod', value: 'fixed' }, { label: 'Hareketli Mod', value: 'moving' } ]}
                    color="blue"
                    fullWidth
                />
                 <Select
                    label="Oyun Alanı"
                    value={region}
                    onChange={setRegion}
                    data={regionData}
                />
                <Group grow>
                    <NumberInput label="Tur Sayısı" value={rounds} onChange={setRounds} min={1} max={20} />
                    <Select
                        label="Tur Başına Süre"
                        value={timeLimit}
                        onChange={(value) => setTimeLimit(value || 'Sınırsız')}
                        data={[
                            { value: '60', label: '1 Dakika' },
                            { value: '180', label: '3 Dakika' },
                            { value: '300', label: '5 Dakika' },
                            { value: 'Sınırsız', label: 'Sınırsız' },
                        ]}
                    />
                </Group>
                <Button onClick={startGame} size="md">Oyuna Başla</Button>
            </Stack>
          </Paper>
        </Stack>
      </Paper>
    </Center>
  );
};

export default MainMenu;
