'use client';

import { use, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { SignatureCapture } from '@/components/signatures/signature-canvas';
import { publicApiClient } from '@/lib/api/public-client';
import type { ISignature } from '@/types';

interface SignPageProps {
  params: Promise<{ token: string }>;
}

type PageState = 'loading' | 'ready' | 'signing' | 'signed' | 'expired' | 'error';

export default function SignPage({ params }: SignPageProps) {
  const { token } = use(params);
  const [state, setState] = useState<PageState>('loading');
  const [signatureRequest, setSignatureRequest] = useState<{ signerName: string; documentType: string; caseId: string } | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    publicApiClient.get<ISignature>(`/signatures/token/${token}`)
      .then((res) => {
        const sig = res.data;
        if (sig.signedAt) {
          setState('signed');
          return;
        }
        setSignatureRequest({ signerName: sig.signerName, documentType: sig.documentType, caseId: sig.caseId });
        setSignerName(sig.signerName ?? '');
        setState('ready');
      })
      .catch((err) => {
        const status = err?.response?.status;
        setState(status === 404 || status === 410 ? 'expired' : 'error');
        setErrorMsg('This signature link is invalid or has expired.');
      });
  }, [token]);

  async function handleSign() {
    if (!signatureDataUrl || !signerName.trim()) return;
    setState('signing');
    try {
      await publicApiClient.post(`/signatures/${token}/sign`, {
        signatureDataUrl,
        signerName: signerName.trim(),
      });
      setState('signed');
    } catch {
      setState('error');
      setErrorMsg('Failed to submit signature. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Electronic Signature</h1>
        </div>

        {state === 'loading' && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {(state === 'expired' || state === 'error') && (
          <div className="rounded-md border p-6 text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="font-medium">Link unavailable</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            {state === 'error' && (
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            )}
          </div>
        )}

        {state === 'signed' && (
          <div className="text-center py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            <h2 className="text-xl font-semibold">Document Signed</h2>
            <p className="text-muted-foreground text-sm">
              Your signature has been recorded. You may close this window.
            </p>
          </div>
        )}

        {(state === 'ready' || state === 'signing') && signatureRequest && (
          <div className="space-y-6">
            {/* Document info */}
            <div className="rounded-md border p-4 space-y-2">
              <p className="text-sm font-medium">Document</p>
              <p className="text-sm text-muted-foreground">{signatureRequest.documentType.replace('_', ' ')}</p>
            </div>

            <Separator />

            {/* Signer name confirmation */}
            <div className="space-y-1">
              <Label htmlFor="signerName" className="font-medium">
                Your Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="h-12 text-base"
                placeholder="Type your full legal name"
              />
            </div>

            {/* Signature canvas */}
            <div className="space-y-2">
              <Label className="font-medium">
                Draw Your Signature <span className="text-destructive">*</span>
              </Label>
              <SignatureCapture onSave={(dataUrl) => setSignatureDataUrl(dataUrl)} />
              {signatureDataUrl && (
                <p className="text-xs text-green-700">Signature captured. You can redraw if needed.</p>
              )}
            </div>

            {/* Legal notice */}
            <p className="text-xs text-muted-foreground">
              By clicking &quot;Sign Document&quot;, you agree that your electronic signature is legally binding under the Electronic Signatures in Global and National Commerce Act (ESIGN) and Uniform Electronic Transactions Act (UETA).
            </p>

            <Button
              className="w-full h-12 text-base"
              onClick={handleSign}
              disabled={!signatureDataUrl || !signerName.trim() || state === 'signing'}
            >
              {state === 'signing' ? 'Submitting...' : 'Sign Document'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
