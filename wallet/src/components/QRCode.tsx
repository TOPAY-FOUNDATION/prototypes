'use client';

import { useEffect, useRef, useState } from 'react';
import QRCodeLib from 'qrcode';

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!canvasRef.current || !value) return;

      try {
        setError(null);
        await QRCodeLib.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (err) {
        console.error('Error generating QR code:', err);
        setError('Failed to generate QR code');
      }
    };

    generateQR();
  }, [value, size]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`} style={{ width: size, height: size }}>
        <span className="text-red-500 text-sm">QR Error</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}