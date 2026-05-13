'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { getCaseSignatures, createSignatureRequest } from '@/lib/api/signatures';
import { formatDate } from '@/lib/utils/format-date';

function SignatureList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['signatures', caseId],
    queryFn: () => getCaseSignatures(caseId),
  });

  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => createSignatureRequest(caseId, { documentType: docType, signerName, signerEmail }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signatures', caseId] });
      toast.success('Signature request sent.');
      setOpen(false);
      setDocType('');
      setSignerName('');
      setSignerEmail('');
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Signature Requests</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Send Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Signature Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Document Type</Label>
                <Input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="Authorization, GPL, etc." />
              </div>
              <div>
                <Label>Signer Name</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label>Signer Email</Label>
                <Input type="email" value={signerEmail} onChange={(e) => setSignerEmail(e.target.value)} placeholder="email@example.com" />
              </div>
              <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !docType || !signerName || !signerEmail}>
                {mutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {signatures.length === 0 ? (
        <p className="text-sm text-muted-foreground">No signature requests yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {signatures.map((sig) => (
            <div key={sig.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{sig.documentType}</p>
                <p className="text-xs text-muted-foreground">{sig.signerName} &middot; {formatDate(sig.createdAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={sig.signedAt ? 'default' : 'outline'}>
                  {sig.signedAt ? 'Signed' : 'Pending'}
                </Badge>
                {sig.signedAt && sig.signatureData && (
                  <Button variant="ghost" size="sm" onClick={() => window.open(sig.signatureData!, '_blank')}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseSignaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <SignatureList caseId={id} />
    </div>
  );
}
