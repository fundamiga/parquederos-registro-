import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Escaner from './pages/Escaner';
import Motos from './pages/Motos';
import Abonos from './pages/Abonos';
import Parqueadero from './pages/Parqueadero';
import Historial from './pages/Historial';

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/escaner" element={<Layout><Escaner /></Layout>} />
            <Route path="/motos" element={<Layout><Motos /></Layout>} />
            <Route path="/abonos" element={<Layout><Abonos /></Layout>} />
            <Route path="/parqueadero" element={<Layout><Parqueadero /></Layout>} />
            <Route path="/historial" element={<Layout><Historial /></Layout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}