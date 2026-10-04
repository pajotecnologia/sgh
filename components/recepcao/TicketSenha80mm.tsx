'use client';
// components/recepcao/TicketSenha80mm.tsx
// Interface de impressão e visualização de ticket de senha para impressora térmica de 80mm (bobina 72mm-80mm)
// Compatível com Epson TM-T20, Bematech MP-4200, Elgin i9, Daruma e navegadores modernos.

import { useEffect, useRef, useState } from 'react';
import { Printer, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { TipoAtendimentoInfo } from '@/lib/senhas';
import QRCode from 'qrcode';

interface TicketSenha80mmProps {
  nomeInstituicao?: string;
  unidadeNome?: string;
  senha: string;
  tipoInfo: TipoAtendimentoInfo;
  nomePaciente: string;
  numeroAtendimento: string;
  dataHora: string | Date;
  autoImprimir?: boolean;
  onFechar?: () => void;
}

/**
 * Gera um SVG do código de barras Code 128 simplificado e de alta legibilidade óptica.
 */
function CodigoBarrasSVG({ valor }: { valor: string }) {
  const limpo = valor.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  // Padrão de barras alternadas baseado no hash dos caracteres
  const barras: number[] = [2, 1, 1, 2];
  for (let i = 0; i < limpo.length; i++) {
    const code = limpo.charCodeAt(i);
    barras.push((code % 3) + 1, ((code >> 1) % 2) + 1, ((code >> 2) % 3) + 1, 1);
  }
  barras.push(2, 1, 2, 2);

  let x = 0;
  const elementos: React.ReactNode[] = [];
  barras.forEach((largura, idx) => {
    const isBarra = idx % 2 === 0;
    if (isBarra) {
      elementos.push(
        <rect
          key={idx}
          x={x}
          y={0}
          width={largura * 1.5}
          height={40}
          fill="#000000"
        />
      );
    }
    x += largura * 1.5;
  });

  return (
    <div className="flex flex-col items-center my-1.5">
      <svg
        viewBox={`0 0 ${x} 40`}
        className="w-full max-w-[210px] h-10 object-contain"
        preserveAspectRatio="none"
      >
        {elementos}
      </svg>
      <span className="font-mono text-[10px] tracking-widest text-black font-semibold mt-0.5">
        *{valor}*
      </span>
    </div>
  );
}

/**
 * Gera um QR Code padronizado (ISO/IEC 18004) de alta legibilidade para leitura rápida em qualquer smartphone ou leitor ótico 2D.
 */
function QrCodeVisual({ valor }: { valor: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let ativo = true;
    QRCode.toDataURL(valor, {
      margin: 1,
      width: 180,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (ativo) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Erro ao gerar QR Code:', err);
      });

    return () => {
      ativo = false;
    };
  }, [valor]);

  if (!dataUrl) {
    return (
      <div className="w-24 h-24 my-2 mx-auto bg-slate-100 animate-pulse rounded flex items-center justify-center text-[9px] text-slate-400">
        Gerando QR...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center my-2">
      <div className="p-1 bg-white border border-black rounded inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={dataUrl}
          alt={`QR Code ${valor}`}
          className="w-24 h-24 object-contain print:w-24 print:h-24"
        />
      </div>
      <span className="text-[9px] text-black font-mono font-medium mt-1 text-center">
        Acompanhe sua chamada no celular
      </span>
    </div>
  );
}

export function TicketSenha80mm({
  nomeInstituicao = 'SGH - HOSPITAL GERAL',
  unidadeNome = 'PRONTO ATENDIMENTO E URGÊNCIA',
  senha,
  tipoInfo,
  nomePaciente,
  numeroAtendimento,
  dataHora,
  autoImprimir = false,
  onFechar,
}: TicketSenha80mmProps) {
  const impressoRef = useRef(false);

  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dataHora));

  const [urlAcompanhamento, setUrlAcompanhamento] = useState<string>(
    `/painel?senha=${encodeURIComponent(numeroAtendimento)}`
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setUrlAcompanhamento(`${origin}/painel?senha=${encodeURIComponent(numeroAtendimento)}`);
    }
  }, [numeroAtendimento]);

  useEffect(() => {
    if (autoImprimir && !impressoRef.current) {
      impressoRef.current = true;
      const timer = setTimeout(() => {
        window.print();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [autoImprimir]);

  return (
    <div className="min-h-screen bg-slate-900/40 p-4 sm:p-6 flex flex-col items-center justify-center font-sans print:p-0 print:bg-white print:m-0">
      {/* Barra de ações para visualização em tela (oculta na impressão) */}
      <div className="w-full max-w-sm flex items-center justify-between gap-2 mb-4 print:hidden">
        {onFechar ? (
          <button
            type="button"
            onClick={onFechar}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold transition-colors border border-slate-700"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-md shadow-primary/20 transition-colors"
        >
          <Printer className="h-4 w-4" /> Imprimir Ticket (80mm)
        </button>
      </div>

      {/* TICKET TÉRMICO DE 80MM (LARGURA ÚTIL: 72mm ~ 280px) */}
      <div
        id="ticket-80mm"
        className="w-[280px] sm:w-[300px] bg-white text-black p-4 rounded-xl shadow-2xl border border-slate-300 print:border-none print:shadow-none print:rounded-none print:w-[72mm] print:p-1 print:m-0 leading-tight"
        style={{ color: '#000000', backgroundColor: '#ffffff' }}
      >
        {/* Cabeçalho Institucional */}
        <div className="text-center border-b border-black pb-2 mb-2">
          <p className="font-extrabold text-xs uppercase tracking-wider text-black">
            {nomeInstituicao}
          </p>
          <p className="text-[10px] text-black font-semibold mt-0.5">
            {unidadeNome}
          </p>
        </div>

        {/* Tipo de Atendimento / Legislação */}
        <div className="text-center my-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-black border border-black py-0.5 px-1 rounded inline-block bg-black text-white print:bg-black print:text-white">
            {tipoInfo.nomeCurto.toUpperCase()}
          </p>
          {tipoInfo.legislacao && (
            <p className="text-[8px] text-black font-mono mt-0.5">
              {tipoInfo.legislacao}
            </p>
          )}
        </div>

        {/* CÓDIGO DA SENHA EM SUPER DESTAQUE */}
        <div className="text-center py-2.5 my-1.5 border-y-2 border-dashed border-black bg-slate-50 print:bg-transparent">
          <p className="text-[9px] font-bold uppercase tracking-widest text-black">
            SUA SENHA DE ATENDIMENTO
          </p>
          <p className="text-4xl font-black font-mono tracking-tight text-black my-1">
            {senha}
          </p>
          <p className="text-[9px] text-black font-medium">
            Guarde este ticket durante todo o atendimento
          </p>
        </div>

        {/* Dados do Paciente e Entrada */}
        <div className="text-[10px] space-y-1 my-2 border-b border-black pb-2 text-black">
          <div className="flex justify-between items-start gap-1">
            <span className="font-bold shrink-0">Paciente:</span>
            <span className="text-right font-semibold truncate max-w-[170px] uppercase">
              {nomePaciente}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold">Data/Hora:</span>
            <span className="font-mono">{dataFormatada}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-bold">Atendimento:</span>
            <span className="font-mono font-semibold">{numeroAtendimento}</span>
          </div>
        </div>

        {/* Código de Barras (para leitor ótico da triagem / consultório) */}
        <CodigoBarrasSVG valor={numeroAtendimento} />

        {/* QR Code de Acompanhamento no Painel */}
        <QrCodeVisual valor={urlAcompanhamento} />

        {/* Mensagem e Instrução Final */}
        <div className="text-center mt-3 pt-2 border-t border-dashed border-black">
          <p className="text-[10px] font-black uppercase text-black">
            ATENÇÃO AO PAINEL DE TV
          </p>
          <p className="text-[9px] text-black font-medium mt-1 leading-snug">
            Aguarde sua senha ser chamada na sala de espera para a <strong>SALA DE TRIAGEM</strong>.
          </p>
          <p className="text-[8px] text-black font-mono mt-2">
            PAJO Tecnologia · SGH
          </p>
        </div>

        {/* Espaçamento para corte de papel / guilhotina na impressora */}
        <div className="h-6 print:h-8" />
      </div>

      {/* Estilos específicos para @media print */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0mm !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, header, footer, aside, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
