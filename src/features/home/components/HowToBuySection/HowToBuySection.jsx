import React from "react";
import { Search, ShoppingCart, Zap, ArrowRight } from "lucide-react";
import "./HowToBuySection.css";

const STEPS = [
  {
    number: 1,
    title: "Selecciona",
    description: "Elige tus productos favoritos",
    icon: Search,
  },
  {
    number: 2,
    title: "Confirma",
    description: "Retiro o envio a domicilio",
    icon: ShoppingCart,
  },
  {
    number: 3,
    title: "Compra",
    description: "Paga con tarjeta o envia el pedido por WhatsApp",
    icon: Zap,
  },
];

export default function HowToBuySection() {
  return (
    <section className="how-to-buy-section">
      <div className="how-to-buy-section__container">
        <div className="how-to-buy-section__header">
          <h3 className="how-to-buy-section__label">PROCESO</h3>
          <h2 className="how-to-buy-section__title">
            Como <span className="how-to-buy-section__highlight">Comprar</span>
          </h2>
        </div>

        <div className="how-to-buy-section__steps">
          {STEPS.map((step, idx) => {
            const StepIcon = step.icon;

            return (
              <div key={step.number} className="how-to-buy-step">
                <div className="how-to-buy-step__number">{step.number}</div>
                <div className="how-to-buy-step__icon-wrapper">
                  <StepIcon size={24} className="how-to-buy-step__icon" />
                </div>
                <div className="how-to-buy-step__content">
                  <h4 className="how-to-buy-step__title">{step.title}</h4>
                  <p className="how-to-buy-step__description">{step.description}</p>
                </div>
                {idx < STEPS.length - 1 ? (
                  <ArrowRight size={20} className="how-to-buy-step__arrow" />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
