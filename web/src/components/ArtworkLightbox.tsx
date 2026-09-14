import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { stripMarkdown } from '@/lib/utils';
import type { Artwork } from '@/types';

interface ArtworkLightboxProps {
  artwork: Artwork;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtworkLightbox({ artwork, isOpen, onClose }: ArtworkLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gestos touch vivem em refs: mudam a cada frame de um pinch sem
  // justificar re-render por si só (o estado zoom/position já renderiza).
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const tapStartRef = useRef<{ time: number; x: number; y: number; moved: boolean } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  // Reset zoom & pan when opening/closing or changing artwork
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, artwork.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 0.3, 4));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 0.3, 0.8));
      } else if (e.key === '0') {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      } else if (e.key === 'i' || e.key === 'I') {
        setShowInfo((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const imageUrl = artwork.imageUrl || '/placeholder-image.jpg';

  // O botão ℹ️ passou a revelar CONTEXTO (descrição da obra), não a mesma
  // legenda que já fica no topo — antes ele só duplicava título/artista/ano.
  const description = artwork.description ? stripMarkdown(artwork.description).trim() : '';

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.4, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.4, 0.8));
  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const touchDist = (t: React.TouchList) => {
    const a = t[0];
    const b = t[1];
    if (!a || !b) return 0;
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: touchDist(e.touches), zoom };
      tapStartRef.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      if (!t) return;
      tapStartRef.current = { time: Date.now(), x: t.clientX, y: t.clientY, moved: false };
      if (zoom > 1) {
        setIsDragging(true);
        setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const next = Math.min(
        Math.max((pinchRef.current.zoom * touchDist(e.touches)) / pinchRef.current.dist, 0.8),
        4
      );
      setZoom(next);
      if (tapStartRef.current) tapStartRef.current.moved = true;
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      const t = e.touches[0];
      if (!t) return;
      setPosition({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
      if (tapStartRef.current) tapStartRef.current.moved = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) setIsDragging(false);

    // Duplo-toque rápido e sem arrasto alterna entre ajustado e 2x
    const start = tapStartRef.current;
    tapStartRef.current = null;
    const changed = e.changedTouches[0];
    if (!start || start.moved || Date.now() - start.time > 250 || !changed) return;

    const last = lastTapRef.current;
    if (
      last &&
      Date.now() - last.time < 300 &&
      Math.hypot(changed.clientX - last.x, changed.clientY - last.y) < 40
    ) {
      if (zoom > 1) {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      } else {
        setZoom(2);
      }
      lastTapRef.current = null;
    } else {
      lastTapRef.current = { time: Date.now(), x: changed.clientX, y: changed.clientY };
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Barra superior — no mobile empilha (título numa linha, controles na
          outra): título truncado nunca mais disputa pixel com a toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex flex-col gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white/90 min-w-0">
          <h3 className="font-display font-semibold text-sm sm:text-lg drop-shadow-md truncate">{artwork.title}</h3>
          <p className="text-[11px] sm:text-xs text-white/60 truncate">
            {artwork.artistOrDirector} {artwork.year ? `• ${artwork.year}` : ''}
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1 sm:gap-2 self-end bg-black/50 backdrop-blur border border-white/10 rounded-full px-2 py-1.5 sm:px-3 shadow-xl shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.8}
            className="h-10 w-10 sm:h-8 sm:w-8 text-white hover:bg-white/20 rounded-full"
            title="Diminuir Zoom (-)"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="hidden sm:block text-xs text-white/80 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="h-10 w-10 sm:h-8 sm:w-8 text-white hover:bg-white/20 rounded-full"
            title="Aumentar Zoom (+)"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-10 w-10 sm:h-8 sm:w-8 text-white hover:bg-white/20 rounded-full"
            title="Resetar Zoom (0)"
            aria-label="Resetar zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-10 w-10 sm:h-8 sm:w-8 text-white hover:bg-white/20 rounded-full"
            title="Alternar Tela Cheia"
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo((v) => !v)}
            className={`h-10 w-10 sm:h-8 sm:w-8 rounded-full ${showInfo ? 'text-amber-400 bg-white/10' : 'text-white hover:bg-white/20'}`}
            title="Alternar Contexto da Obra (I)"
            aria-label="Alternar contexto da obra"
            aria-pressed={showInfo}
          >
            <Info className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 sm:h-8 sm:w-8 text-white hover:bg-destructive hover:text-white rounded-full transition-colors"
            title="Fechar (Esc)"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Image Stage — touch-none entrega pinch/pan/duplo-toque pros
          nossos handlers em vez do navegador; paddings reservam o topo e o
          painel inferior no mobile pra imagem nunca ficar debaixo deles */}
      <div
        className="w-full h-full flex items-center justify-center px-3 pt-24 pb-36 sm:p-4 sm:py-20 overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt={artwork.title}
          draggable={false}
          className="max-h-full max-w-full object-contain transition-transform duration-200 [transition-timing-function:var(--ease-liturgico)] shadow-2xl rounded-sm animate-in zoom-in-95 fade-in duration-300"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        />
      </div>

      {/* Discrete Bottom Info Overlay — contexto de verdade: descrição da
          obra em texto puro; sem descrição, cai pro rótulo clássico.
          Atribuição permanece (obrigação de licença, não decoração). */}
      {showInfo && (
        <div className="absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[92%] sm:max-w-xl bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-3 sm:p-4 text-center text-white/90 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          {description ? (
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed line-clamp-4">
              {description}
            </p>
          ) : (
            <p className="text-sm font-serif italic text-white/90 line-clamp-2">
              "{artwork.title}"
            </p>
          )}
          {artwork.attributionText && (
            <p className="text-[11px] text-white/50 mt-1.5 border-t border-white/10 pt-1.5 truncate">
              {artwork.attributionText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
