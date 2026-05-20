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
import { Loader2, ShieldCheck } from 'lucide-react';
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black px-6">
        <div className="w-full max-w-sm rounded-[2rem] border border-green-500/20 bg-zinc-950 p-8 text-center shadow-2xl shadow-green-500/10">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-green-500 text-black shadow-lg shadow-green-500/20">
            <Loader2 size={30} className="animate-spin" />
          </div>
          <div className="flex items-center justify-center gap-2 text-green-400">
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.28em]">Galvar Sport</span>
          </div>
          <p className="mt-3 text-lg font-black uppercase text-white">Cargando tienda...</p>
          <p className="mt-2 text-xs font-bold text-zinc-500">Preparando catalogo y seguridad de la sesion.</p>
      </div>
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
