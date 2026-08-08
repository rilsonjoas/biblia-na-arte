import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white/90">
          <h3 className="font-display font-semibold text-lg drop-shadow-md">{artwork.title}</h3>
          <p className="text-xs text-white/60">
            {artwork.artistOrDirector} {artwork.year ? `• ${artwork.year}` : ''}
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur border border-white/10 rounded-full px-3 py-1.5 shadow-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomOut}
            disabled={zoom <= 0.8}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            title="Diminuir Zoom (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>

          <span className="text-xs text-white/80 font-mono w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            title="Resetar Zoom (0)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8 text-white hover:bg-white/20 rounded-full"
            title="Alternar Tela Cheia"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowInfo((v) => !v)}
            className={`h-8 w-8 rounded-full ${showInfo ? 'text-amber-400 bg-white/10' : 'text-white hover:bg-white/20'}`}
            title="Alternar Detalhes (I)"
          >
            <Info className="w-4 h-4" />
          </Button>

          <div className="w-[1px] h-4 bg-white/20 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-destructive hover:text-white rounded-full transition-colors"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="w-full h-full flex items-center justify-center p-4 overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        <img
          src={imageUrl}
          alt={artwork.title}
          draggable={false}
          className="max-h-[88vh] max-w-[90vw] object-contain transition-transform duration-75 shadow-2xl rounded-sm"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
          }}
        />
      </div>

      {/* Discrete Bottom Info Overlay */}
      {showInfo && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-black/75 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center text-white/90 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
          <p className="text-sm font-serif italic text-white/90 line-clamp-2">
            "{artwork.title}"
          </p>
          <div className="flex items-center justify-center gap-3 text-xs text-white/60 mt-1">
            <span>{artwork.artistOrDirector}</span>
            {artwork.year && <span>• {artwork.year}</span>}
            <span>• {artwork.licenseType === 'public-domain' ? 'Domínio Público' : 'Licença autorizada'}</span>
          </div>
          {artwork.attributionText && (
            <p className="text-[11px] text-white/40 mt-1.5 border-t border-white/10 pt-1.5 truncate">
              {artwork.attributionText}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
