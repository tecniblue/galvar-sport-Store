import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Truck, RefreshCcw, HelpCircle, ShieldAlert, FileText, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    id: "envios",
    icon: <Truck size={18} />,
    title: "Envíos y Entregas",
    content: (
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Política de Envíos</h2>
        <p>En Galvar Sport realizamos envíos a todo Chile a través de las principales empresas de logística (Blue Express, Starken, Chilexpress). Nuestro objetivo es que recibas tu equipamiento en el menor tiempo posible.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Plazos de Despacho</h3>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-white">Región de Antofagasta:</strong> Entregas en 24-48 horas hábiles.</li>
          <li><strong className="text-white">Otras Regiones:</strong> 3 a 7 días hábiles dependiendo de la zona geográfica.</li>
        </ul>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Seguimiento</h3>
        <p>Una vez que tu pedido sea entregado al transportista, recibirás un correo electrónico con el número de seguimiento para que puedas monitorear tu paquete en tiempo real.</p>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mt-8">
          <p className="text-xs uppercase tracking-widest font-bold text-green-400 mb-2">Consideraciones</p>
          <p className="text-xs italic">Los costos de envío se calculan automáticamente al finalizar la compra basándose en el peso del paquete y el destino. Es responsabilidad del cliente entregar una dirección correcta y asegurar que haya alguien para recibir el pedido.</p>
        </div>
      </div>
    )
  },
  {
    id: "cambios",
    icon: <RefreshCcw size={18} />,
    title: "Cambios y Devoluciones",
    content: (
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Garantía, Cambios y Devoluciones</h2>
        <p>En cumplimiento con la <strong>Ley N° 19.496 de Protección de los Derechos de los Consumidores</strong>, establecemos las siguientes políticas para asegurar tu satisfacción.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Garantía Legal (3 Meses)</h3>
        <p>Si el producto que compraste presenta fallas, defectos de fabricación, le faltan piezas o no es apto para el uso destinado, tienes derecho a la garantía legal dentro de los <strong>3 meses</strong> siguientes a la recepción. Puedes optar por:</p>
        <ul className="list-disc pl-5 space-y-2 mt-2">
          <li>Reparación gratuita del producto.</li>
          <li>Reposición o cambio por uno nuevo.</li>
          <li>Devolución del dinero pagado.</li>
        </ul>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Derecho a Retracto (10 Días)</h3>
        <p>Para compras realizadas a través de nuestro sitio web, Galvar Sport otorga el <strong>Derecho a Retracto</strong>. Tienes un plazo de 10 días desde la recepción del producto para anular tu compra, siempre y cuando el producto esté <strong>nuevo, sin uso, con sus etiquetas y en su embalaje original intacto</strong>.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Satisfacción Garantizada (Cambios)</h3>
        <p>Si simplemente quieres cambiar tu producto por talla o modelo, te ofrecemos un plazo de 30 días corridos para realizar el cambio, sujeto a disponibilidad de stock y cumplimiento de las condiciones de estado del producto mencionadas anteriormente.</p>

        <p className="text-xs italic mt-8 border-l-2 border-zinc-800 pl-4">Para iniciar cualquier proceso, escríbenos a <strong>+</strong> o a nuestro WhatsApp de atención al cliente.</p>
      </div>
    )
  },
  {
    id: "faq",
    icon: <HelpCircle size={18} />,
    title: "Preguntas Frecuentes",
    content: (
      <div className="space-y-8 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Preguntas Frecuentes (FAQ)</h2>

        <div>
          <h3 className="text-white font-bold mb-2">¿Cuáles son los medios de pago?</h3>
          <p>Aceptamos tarjetas de crédito y débito a través de <strong>Mercado Pago</strong>. También puedes optar por transferencia electrónica o efectivo en caso de retiro presencial en Antofagasta.</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">¿Hacen envíos a regiones?</h3>
          <p>Sí, llegamos a todo Chile. Trabajamos con transportistas externos que aseguran la entrega en la puerta de tu casa o en oficina del transportista según prefieras.</p>
        </div>

        <div>
          <h3 className="text-white font-bold mb-2">¿Cómo sé mi talla?</h3>
          <p>Cada producto incluye una descripción detallada. Si tienes dudas, puedes consultarnos vía WhatsApp y te asesoraremos para que elijas el equipo ideal para tu rendimiento.</p>
        </div>
      </div>
    )
  },
  {
    id: "privacidad",
    icon: <ShieldAlert size={18} />,
    title: "Política de Privacidad",
    content: (
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Política de Privacidad</h2>
        <p>De acuerdo con la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong>, Galvar Sport garantiza que tus datos personales serán tratados con absoluta confidencialidad.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Uso de los Datos</h3>
        <p>La información recopilada (Nombre, RUT, Dirección, Email, Teléfono) tiene como única finalidad el procesamiento de tus pedidos, la logística de despacho y el envío de información relevante sobre tu compra. Galvar Sport no vende ni cede tus datos a terceros.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Seguridad en Pagos</h3>
        <p>Nuestro sitio utiliza pasarelas de pago seguras que cumplen con estándares internacionales. No almacenamos información financiera sensible como números de tarjetas de crédito o claves bancarias.</p>
      </div>
    )
  },
  {
    id: "terminos",
    icon: <FileText size={18} />,
    title: "Términos y Condiciones",
    content: (
      <div className="space-y-6 text-sm text-zinc-400 leading-relaxed">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-6">Términos y Condiciones</h2>
        <p>Al acceder y utilizar este sitio web, el usuario acepta los términos y condiciones de Galvar Sport, los cuales se rigen por la legislación chilena vigente.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Identificación del Proveedor</h3>
        <p>Galvar Sport es una tienda especializada en equipamiento deportivo con base en Antofagasta, Chile. Cualquier comunicación oficial debe realizarse a través de nuestros canales de contacto publicados.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Precios y Stock</h3>
        <p>Todos los precios incluyen IVA. La disponibilidad de productos está sujeta al stock mostrado en el sitio. En caso de errores sistémicos que afecten el precio o stock, nos comunicaremos para resolver la situación mediante cambio o anulación.</p>

        <h3 className="text-lg font-bold text-white uppercase mt-8 mb-4">Validez de la Oferta</h3>
        <p>Las ofertas y promociones publicadas son válidas únicamente por el tiempo indicado o hasta agotar stock.</p>
      </div>
    )
  }
];

export default function InfoPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (section) {
      const found = SECTIONS.find(s => s.id === section);
      if (found) {
        setActiveSection(found);
      } else {
        navigate('/info/envios', { replace: true });
      }
    } else {
      navigate('/info/envios', { replace: true });
    }
  }, [section, navigate]);

  return (
    <div className="pt-28 sm:pt-32 md:pt-36 container mx-auto px-6 pb-20 md:pb-24 min-h-screen flex flex-col">
      <header className="mb-12 md:mb-16">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none text-white">
          Centro de <span className="text-green-500">Ayuda</span>
        </h1>
        <p className="mt-3 text-zinc-500 uppercase tracking-widest text-xs font-bold italic">
          Todo lo que necesitas saber sobre tu compra
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 flex-grow">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <div className="glass rounded-[2rem] border border-zinc-900 p-4 sticky top-32">
            <nav className="flex flex-col space-y-1">
              {SECTIONS.map((sec) => {
                const isActive = activeSection.id === sec.id;
                return (
                  <Link
                    key={sec.id}
                    to={`/info/${sec.id}`}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl transition-all ${isActive
                      ? "bg-green-500/10 border border-green-500/30 text-green-400"
                      : "border border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-white"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${isActive ? "text-green-500" : "text-zinc-600"}`}>
                        {sec.icon}
                      </span>
                      <span className="text-[11px] font-black uppercase tracking-widest">
                        {sec.title}
                      </span>
                    </div>
                    {isActive && <ChevronRight size={14} className="text-green-500" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-grow glass rounded-[3rem] border border-zinc-900 p-8 sm:p-12 md:p-16 text-left">
          {activeSection.content}
        </main>
      </div>
    </div>
  );
}
