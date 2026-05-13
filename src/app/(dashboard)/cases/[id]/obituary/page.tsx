'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient } from '@/lib/api/client';
import { Copy, Wand2 } from 'lucide-react';

function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}

function ObituaryEditor({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: obituary, isLoading: obituaryLoading } = useQuery({
    queryKey: ['obituary', caseId],
    queryFn: () =>
      apiClient.get(`/cases/${caseId}/obituary`).then((r) => r.data).catch((e) => {
        if (e?.response?.status === 404) return null;
        throw e;
      }),
  });

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}`).then((r) => r.data),
  });

  const [draft, setDraft] = useState('');
  const [saveIndicator, setSaveIndicator] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => { if (obituary?.draftText) setDraft(obituary.draftText); }, [obituary]);

  const saveMutation = useMutation({
    mutationFn: (text: string) =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: text }),
    onMutate: () => setSaveIndicator('saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Obituary saved.');
      setSaveIndicator('saved');
      setTimeout(() => setSaveIndicator('idle'), 2000);
    },
    onError: () => setSaveIndicator('idle'),
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: draft, status: 'approved' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Obituary approved.');
    },
  });

  const reviseMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/cases/${caseId}/obituary`, { draftText: draft, status: 'draft' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Returned to draft.');
    },
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/cases/${caseId}/obituary/generate`).then((r) => r.data),
    onSuccess: (data) => {
      setDraft(data.draftText ?? '');
      queryClient.invalidateQueries({ queryKey: ['obituary', caseId] });
      toast.success('Draft generated.');
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(draft).then(() => toast.success('Copied to clipboard'));
  };

  const deceasedName = caseData?.deceasedName ?? '';

  if (obituaryLoading) return <Skeleton className="h-64 w-full" />;

  // Approved read-only view
  if (obituary?.status === 'approved') {
    return (
      <Card className="max-w-3xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <StatusPill kind="completed" />
            {deceasedName && (
              <h2 className="text-xl font-semibold tracking-tight">{deceasedName}</h2>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => reviseMutation.mutate()}
              disabled={reviseMutation.isPending}
            >
              Revise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">
            {obituary.draftText}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Draft two-column editor
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor column */}
      <div className="space-y-3">
        <Textarea
          rows={16}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Click Generate to create a draft from case data, or type directly..."
          className="text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {wordCount(draft)} {wordCount(draft) === 1 ? 'word' : 'words'}
          </p>
          {saveIndicator === 'saving' && (
            <p className="text-xs text-muted-foreground">Saving...</p>
          )}
          {saveIndicator === 'saved' && (
            <p className="text-xs text-green-600">Saved ✓</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Wand2 className="h-3.5 w-3.5 mr-1.5" />
            {generateMutation.isPending ? 'Generating…' : 'Generate'}
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate(draft)}
            disabled={saveMutation.isPending || !draft}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || !draft}
          >
            Approve
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!draft}>
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy
          </Button>
        </div>
      </div>

      {/* Preview column */}
      <Card className="lg:sticky lg:top-6 self-start">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {draft ? (
            <div>
              {deceasedName && (
                <h3 className="text-base font-semibold mb-3">{deceasedName}</h3>
              )}
              <p className="text-sm leading-7 whitespace-pre-wrap text-foreground">{draft}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Your obituary draft will appear here as you type.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseObituaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <div className="mt-4">
        <ObituaryEditor caseId={id} />
      </div>
    </div>
  );
}
