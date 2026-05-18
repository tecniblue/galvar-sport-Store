import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

// Componentes
import { Navbar, Footer } from './components/layout';
import CartDrawer from './features/store/components/CartDrawer';
import { Toast } from './components/ui';

// Páginas
import HomePage from './pages/HomePage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import InfoPage from './pages/InfoPage';
import { useUIStore } from './store';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const isBootstrapping = useUIStore(s => s.isBootstrapping);

  if (isBootstrapping) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '16px', zIndex: 9999
      }}>
        <div style={{
          width: '48px', height: '48px',
          border: '3px solid #333',
          borderTop: '3px solid #e53e3e',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ color: '#666', fontSize: '14px', letterSpacing: '0.05em' }}>Cargando...</span>
      </div>
    );
  }

  return (
      <Router>
        <ScrollToTop />
        <Toast />
        {/* El Navbar está AQUÍ, fuera de las rutas */}
        <Navbar toggleCart={openCart} />
        
        {/* El Carrito lateral también es global */}
        <CartDrawer isOpen={isCartOpen} onClose={closeCart} />

        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tienda" element={<StorePage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/info/:section?" element={<InfoPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>

        <Footer />
      </Router>
  );
}

export default App;
