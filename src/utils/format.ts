export const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Agora';
  if (diffMinutes < 60) return `${diffMinutes} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias`;
  
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
