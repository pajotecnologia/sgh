// components/recepcao/BotaoImprimirFicha.tsx — window.print só no cliente (evita problema com RSC)
'use client';

export function BotaoImprimirFicha() {
  return (
    <button
      type="button"
      className="px-4 py-2 bg-primary text-white rounded-lg font-semibold print:hidden"
      onClick={() => window.print()}
    >
      Imprimir Ficha
    </button>
  );
}
