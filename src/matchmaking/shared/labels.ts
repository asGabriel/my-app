import type { GameMode, Gender, TeamStatus } from '../../api';

export const genderLabel: Record<Gender, string> = {
  male: 'Masculino',
  female: 'Feminino',
};

export const genderOptions: { label: string; value: Gender }[] = [
  { label: genderLabel.male, value: 'male' },
  { label: genderLabel.female, value: 'female' },
];

export const gameModeLabel: Record<GameMode, string> = {
  male: 'Masculino',
  female: 'Feminino',
  mixed: 'Misto',
  open: 'Aberto',
};

/** Cores de "etiqueta" (fundo claro + texto escuro, contraste ≥ 4.5:1). */
export const gameModeTagColors: Record<GameMode, { bg: string; fg: string }> = {
  male: { bg: '#DBEAFE', fg: '#1E40AF' },
  female: { bg: '#FCE7F3', fg: '#9D174D' },
  mixed: { bg: '#F3E8FF', fg: '#6B21A8' },
  open: { bg: '#DCFCE7', fg: '#166534' },
};

export const teamStatusLabel: Record<TeamStatus, string> = {
  draft: 'Rascunho',
  holding: 'Segurando quadra',
  playing: 'Jogando',
  disbanded: 'Encerrado',
};

export const teamStatusTagColors: Record<TeamStatus, { bg: string; fg: string }> = {
  draft: { bg: '#DBEAFE', fg: '#1E40AF' },
  holding: { bg: '#FEF3C7', fg: '#854D0E' },
  playing: { bg: '#DCFCE7', fg: '#166534' },
  disbanded: { bg: '#EDE7DD', fg: '#57534E' },
};
