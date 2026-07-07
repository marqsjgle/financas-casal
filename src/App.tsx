/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Cadastro } from './pages/Cadastro';
import { EsqueciSenha } from './pages/EsqueciSenha';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { NovoLancamento } from './pages/NovoLancamento';
import { Extrato } from './pages/Extrato';
import { Dashboard } from './pages/Dashboard';
import { Configuracoes } from './pages/Configuracoes';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route element={<Layout />}>
            <Route path="/" element={<NovoLancamento />} />
            <Route path="/extrato" element={<Extrato />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-center" richColors />
    </AuthProvider>
  );
}
