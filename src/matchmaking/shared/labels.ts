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

export const gameModeColor: Record<GameMode, string> = {
  male: 'blue',
  female: 'magenta',
  mixed: 'purple',
  open: 'green',
};

export const teamStatusLabel: Record<TeamStatus, string> = {
  draft: 'Rascunho',
  holding: 'Segurando quadra',
  playing: 'Jogando',
  disbanded: 'Encerrado',
};

export const teamStatusColor: Record<TeamStatus, string> = {
  draft: 'blue',
  holding: 'gold',
  playing: 'green',
  disbanded: 'default',
};
