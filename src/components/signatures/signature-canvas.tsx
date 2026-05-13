'use client';

import { useEffect, useRef, useState } from 'react';
import type ReactSignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
  onSave: (dataUrl: string) => void;
}

export function SignatureCapture({ onSave }: SignatureCanvasProps) {
  const canvasRef = useRef<ReactSignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [SignatureCanvasComponent, setSignatureCanvasComponent] = useState<typeof ReactSignatureCanvas | null>(null);

  useEffect(() => {
    // Lazy-load on client only — react-signature-canvas accesses document
    import('react-signature-canvas').then((mod) => {
      setSignatureCanvasComponent(() => mod.default);
    });
  }, []);

  function handleSave() {
    const canvas = canvasRef.current;
    if (canvas && !canvas.isEmpty()) {
      onSave(canvas.getTrimmedCanvas().toDataURL('image/png'));
    }
  }

  function handleClear() {
    canvasRef.current?.clear();
    setIsEmpty(true);
  }

  return (
    <div className="space-y-3">
      <div className="border rounded-md overflow-hidden bg-white">
        {SignatureCanvasComponent ? (
          <SignatureCanvasComponent
            ref={canvasRef}
            penColor="black"
            canvasProps={{ className: 'w-full h-40', width: 600, height: 160 }}
            onEnd={() => setIsEmpty(false)}
          />
        ) : (
          <div className="h-40 w-full border rounded-md bg-gray-50 animate-pulse" />
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={isEmpty}>Save Signature</Button>
        <Button size="sm" variant="outline" onClick={handleClear}>Clear</Button>
      </div>
    </div>
  );
}
