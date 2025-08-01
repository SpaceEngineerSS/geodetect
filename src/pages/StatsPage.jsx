import React, { useState, useEffect } from 'react';
import { Title, Paper, Stack, Table, Text } from '@mantine/core';

const StatsPage = () => {
  const [highScores, setHighScores] = useState([]);

  useEffect(() => {
    document.title = 'GeoDetect - İstatistiklerim';
    const savedScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    setHighScores(savedScores);
  }, []);

  const rows = highScores.map((score, index) => (
    <Table.Tr key={index}>
      <Table.Td>{index + 1}</Table.Td>
      <Table.Td>{score.score}</Table.Td>
      <Table.Td>{new Date(score.date).toLocaleDateString()}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper withBorder p="xl" shadow="md">
      <Stack>
        <Title order={2}>İstatistiklerim</Title>
        <Title order={4}>En Yüksek Skorlar</Title>
        {highScores.length > 0 ? (
          <Table withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Skor</Table.Th>
                <Table.Th>Tarih</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed">Henüz kaydedilmiş bir skorunuz bulunmuyor.</Text>
        )}
      </Stack>
    </Paper>
  );
};

export default StatsPage;
