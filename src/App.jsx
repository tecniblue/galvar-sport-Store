import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';

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

  return (
    <AppProvider>
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
    </AppProvider>
  );
}

export default App;
