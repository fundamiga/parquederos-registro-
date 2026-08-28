import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('placamoto_token'));

  useEffect(() => {
    const saved = localStorage.getItem('placamoto_usuario');
    if (saved) setUsuario(JSON.parse(saved));
  }, []);

  const login = (tokenRecibido, usuarioRecibido) => {
    localStorage.setItem('placamoto_token', tokenRecibido);
    localStorage.setItem('placamoto_usuario', JSON.stringify(usuarioRecibido));
    setToken(tokenRecibido);
    setUsuario(usuarioRecibido);
  };

  const logout = () => {
    localStorage.removeItem('placamoto_token');
    localStorage.removeItem('placamoto_usuario');
    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, isAuth: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
