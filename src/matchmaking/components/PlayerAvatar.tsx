import { schemas, type Gender } from '../../api';
import { color } from '../shared/theme';

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Círculo com as iniciais, na cor do gênero do jogador. */
export function PlayerAvatar({ name, gender }: { name: string; gender?: Gender }) {
  const isMale = gender === schemas.Gender.enum.male;
  return (
    <span
      aria-hidden="true"
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        fontWeight: 700,
        background: isMale ? color.maleBg : color.femaleBg,
        color: isMale ? color.maleFg : color.femaleFg,
      }}
    >
      {initials(name)}
    </span>
  );
}
