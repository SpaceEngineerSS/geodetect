import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from './UserContext';
import { notifications } from '@mantine/notifications';

// Başarımların tanımı
export const achievementsList = {
  firstGuess: { name: 'İlk Adım', description: 'İlk tahminini yap.' },
  perfectScore: { name: 'Usta Kaşif', description: 'Tek turda 5000 puan al.' },
  closeCall: { name: 'Sıcak Takip', description: '1km\'den daha yakın bir tahminde bulun.' },
  aroundTheWorld: { name: 'Dünya Turu', description: 'Tüm kıtalarda oyna.' },
};

// Seviye atlamak için gereken XP miktarları
const XP_PER_LEVEL = 1000;

const PlayerStatsContext = createContext();

export const usePlayerStats = () => useContext(PlayerStatsContext);

export const PlayerStatsProvider = ({ children }) => {
  const { username } = useUser();
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState(new Set());

  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('playerStats'));
    if (savedStats) {
      setLevel(savedStats.level || 1);
      setXp(savedStats.xp || 0);
      setUnlockedAchievements(new Set(savedStats.unlockedAchievements || []));
    }
  }, []);

  useEffect(() => {
    const stats = { level, xp, unlockedAchievements: Array.from(unlockedAchievements) };
    localStorage.setItem('playerStats', JSON.stringify(stats));
  }, [level, xp, unlockedAchievements]);

  const addXp = (amount) => {
    if (amount <= 0) return;
    const newXp = xp + amount;
    if (newXp >= XP_PER_LEVEL) {
      const newLevel = level + 1;
      setLevel(newLevel);
      setXp(newXp % XP_PER_LEVEL);
      notifications.show({
        title: 'Seviye Atladın!',
        message: `Tebrikler, ${newLevel}. seviyeye ulaştın!`,
        color: 'green',
      });
    } else {
      setXp(newXp);
    }
  };

  const unlockAchievement = (achievementId) => {
    if (!unlockedAchievements.has(achievementId)) {
      const newAchievements = new Set(unlockedAchievements);
      newAchievements.add(achievementId);
      setUnlockedAchievements(newAchievements);
      notifications.show({
        title: `Başarım Kazanıldı: ${achievementsList[achievementId].name}`,
        message: achievementsList[achievementId].description,
        color: 'yellow',
      });
    }
  };

  const getRank = () => {
    if (level < 5) return `Acemi Gezgin`;
    if (level < 10) return `Kıta Kaşifi`;
    return `Dünya Seyyahı`;
  };

  const value = {
    level,
    xp,
    xpToNextLevel: XP_PER_LEVEL,
    rank: getRank(),
    unlockedAchievements,
    addXp,
    unlockAchievement,
  };

  return <PlayerStatsContext.Provider value={value}>{children}</PlayerStatsContext.Provider>;
};
