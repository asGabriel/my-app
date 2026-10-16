import { AppleFilled, GoogleOutlined, MobileOutlined, ScissorOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Screen } from '../layouts/Layouts';
import { color, font, outlineButton, plainButton, primaryButton } from '../shared/theme';

const inputStyle = {
  boxSizing: 'border-box',
  width: '100%',
  minHeight: 52,
  borderRadius: 14,
  border: `1px solid ${color.lineStrong}`,
  background: color.surface,
  color: color.ink,
  font: 'inherit',
  fontSize: 16,
  padding: '0 16px',
} as const;

/** Login mockado: qualquer opção entra direto no app do cliente. */
export function Login() {
  const navigate = useNavigate();
  const [withPhone, setWithPhone] = useState(false);
  const enter = () => navigate('/');

  return (
    <Screen style={{ minHeight: '100vh', paddingTop: 0 }} gap={16}>
      <div style={{ flexGrow: 1, minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, textAlign: 'center' }}>
        <div style={{ width: 88, height: 88, borderRadius: 44, border: `1px solid ${color.lineGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color.accent, fontSize: 36 }}>
          <ScissorOutlined />
        </div>
        <span style={{ fontFamily: font.display, fontSize: 34, letterSpacing: '0.28em', paddingLeft: '0.28em', color: color.accent }}>NAVALHA</span>
        <span style={{ width: 40, height: 1, background: color.lineGold }} />
        <p style={{ margin: 0, fontFamily: font.display, fontSize: 22, lineHeight: 1.3, maxWidth: 280 }}>Seu horário, seu barbeiro, sem fila.</p>
      </div>

      {withPhone ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enter();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <label htmlFor="tel" style={{ fontSize: 13, color: color.muted }}>Seu celular</label>
          <input id="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="(00) 00000-0000" style={inputStyle} />
          <button type="submit" style={primaryButton}>Receber código por SMS</button>
          <button type="button" onClick={() => setWithPhone(false)} style={{ ...plainButton, minHeight: 44, textAlign: 'center', fontSize: 14, color: color.muted }}>
            Voltar às outras opções
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" onClick={enter} style={{ ...primaryButton, minHeight: 54, background: color.ink }}>
            <GoogleOutlined /> Continuar com Google
          </button>
          <button type="button" onClick={enter} style={{ ...outlineButton, minHeight: 54 }}>
            <AppleFilled /> Continuar com Apple
          </button>
          <button type="button" onClick={() => setWithPhone(true)} style={{ ...outlineButton, minHeight: 54 }}>
            <MobileOutlined /> Entrar com celular
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <Link to="/barbeiro" style={{ minHeight: 44, display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 600, color: color.accent, textDecoration: 'none' }}>
          Sou barbeiro · acessar a agenda
        </Link>
        <span style={{ fontSize: 12, color: color.muted, textAlign: 'center', lineHeight: 1.5 }}>
          Ao continuar, você aceita os Termos de uso e a Política de privacidade.
        </span>
      </div>
    </Screen>
  );
}
