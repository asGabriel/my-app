import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { BookingProvider } from './BookingContext';
import { BarberLayout, ClientLayout, ShellLayout } from './layouts/Layouts';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Services } from './pages/Services';
import { Schedule } from './pages/Schedule';
import { Confirm } from './pages/Confirm';
import { Club } from './pages/Club';
import { Profile } from './pages/Profile';
import { Units } from './pages/Units';
import { Agenda } from './pages/barber/Agenda';
import { Dashboard } from './pages/barber/Dashboard';

export function BarbershopRouter() {
  return (
    <BrowserRouter>
      <BookingProvider>
        <Routes>
          <Route element={<ShellLayout />}>
            <Route path="entrar" element={<Login />} />
            <Route element={<ClientLayout />}>
              <Route index element={<Home />} />
              <Route path="clube" element={<Club />} />
              <Route path="perfil" element={<Profile />} />
            </Route>
            <Route path="unidades" element={<Units />} />
            <Route path="agendar" element={<Services />} />
            <Route path="agendar/horario" element={<Schedule />} />
            <Route path="agendar/confirmar" element={<Confirm />} />
            <Route path="barbeiro" element={<BarberLayout />}>
              <Route index element={<Agenda />} />
              <Route path="painel" element={<Dashboard />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BookingProvider>
    </BrowserRouter>
  );
}
