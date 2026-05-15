import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Menu, X } from "lucide-react";
import { AppContext } from "../../../context/AppContext";
import { Logo } from "../../brand";
import "./Navbar.css";

const NAVBAR_SCROLL_OFFSET_PX = 96;

export default function Navbar({ toggleCart }) {
  const { cart } = useContext(AppContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + (Number(item?.qty) || 0), 0);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);

      if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
        setIsNavbarVisible(false);
      } else {
        setIsNavbarVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Menu scroll lock effect removed for dropdown mobile menu
  }, [isMenuOpen]);

  const scrollToWithOffset = (id) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_SCROLL_OFFSET_PX;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const handleScrollTo = (id) => {
    setIsMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      window.setTimeout(() => {
        scrollToWithOffset(id);
      }, 350);
      return;
    }

    scrollToWithOffset(id);
  };

  const shouldBeTransparent = location.pathname === "/" && !isScrolled;

  return (
    <>
      <nav
        className={`navbar ${
          shouldBeTransparent ? "navbar--transparent" : "navbar--scrolled"
        } ${!isNavbarVisible ? "navbar--hidden" : ""}`}
      >
        <div className="navbar__container">
          <div className="navbar__logo-wrapper">
            <Logo isNavbar />
          </div>

          <div className="navbar__menu">
            <Link
              to="/"
              className={`navbar__nav-item ${
                location.pathname === "/" ? "navbar__nav-item--active" : ""
              }`}
            >
              Inicio
            </Link>
            <Link
              to="/tienda"
              className={`navbar__nav-item ${
                location.pathname === "/tienda" ? "navbar__nav-item--active" : ""
              }`}
            >
              Tienda
            </Link>
            <button
              type="button"
              onClick={() => handleScrollTo("experiencia")}
              className="navbar__nav-item"
            >
              Asesoria
            </button>
            <button
              type="button"
              onClick={() => handleScrollTo("ubicacion")}
              className="navbar__nav-item"
            >
              Sucursal
            </button>

            <div className="navbar__divider" />
          </div>

          <div className="navbar__actions">
            <button
              type="button"
              onClick={toggleCart}
              className="navbar__cart-btn"
              aria-label="Abrir carrito"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 ? (
                <span className="navbar__cart-badge">{cartCount}</span>
              ) : null}
            </button>

            <a
              href="https://wa.me/56971413309"
              target="_blank"
              rel="noreferrer"
              className="navbar__whatsapp-btn"
            >
              WhatsApp
            </a>

            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="navbar__mobile-toggle"
              aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <X size={24} className="text-green-500" />
              ) : (
                <Menu size={24} className="text-green-500" />
              )}
            </button>
          </div>
        </div>
        
        <div
          className={`navbar__mobile-menu ${
            isMenuOpen ? "navbar__mobile-menu--open" : ""
          }`}
        >
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className={`navbar__mobile-item ${
              location.pathname === "/" ? "navbar__mobile-item--active" : ""
            }`}
          >
            Inicio
          </Link>
          <Link
            to="/tienda"
            onClick={() => setIsMenuOpen(false)}
            className={`navbar__mobile-item ${
              location.pathname === "/tienda" ? "navbar__mobile-item--active" : ""
            }`}
          >
            Tienda
          </Link>
          <button
            type="button"
            onClick={() => handleScrollTo("experiencia")}
            className="navbar__mobile-item"
          >
            Asesoria
          </button>
          <button
            type="button"
            onClick={() => handleScrollTo("ubicacion")}
            className="navbar__mobile-item"
          >
            Sucursal
          </button>
        </div>
      </nav>
    </>
  );
}
