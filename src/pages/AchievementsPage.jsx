import React, { useEffect } from 'react';
import { Title, Paper, Stack, Group, Text, Badge, SimpleGrid } from '@mantine/core';
import { usePlayerStats, achievementsList } from '../context/PlayerStatsContext';

const AchievementsPage = () => {
  const { unlockedAchievements } = usePlayerStats();

  useEffect(() => {
    document.title = 'GeoDetect - Başarımlar';
  }, []);

  return (
    <Paper withBorder p="xl" shadow="md">
      <Stack>
        <Title order={2}>Başarımlar</Title>
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {Object.entries(achievementsList).map(([id, achievement]) => (
            <Paper
              key={id}
              withBorder
              p="md"
              style={{
                opacity: unlockedAchievements.has(id) ? 1 : 0.4,
                transition: 'opacity 0.3s',
              }}
            >
              <Group>
                <Stack gap="xs">
                  <Title order={5}>{achievement.name}</Title>
                  <Text size="sm" c="dimmed">{achievement.description}</Text>
                </Stack>
                {unlockedAchievements.has(id) && (
                  <Badge color="teal" variant="light" style={{ marginLeft: 'auto' }}>
                    Kazanıldı
                  </Badge>
                )}
              </Group>
            </Paper>
          ))}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
};

export default AchievementsPage;
