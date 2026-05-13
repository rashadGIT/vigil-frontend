'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';

type CremationStatus = 'pending' | 'authorized' | 'waiting_period' | 'cleared' | 'performed';

const schema = z.object({
  authorizerName: z.string().min(1, 'Authorizer name is required'),
  authorizerRelationship: z.string().min(1, 'Relationship is required'),
  authorizerPhone: z.string().optional(),
  authorizerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  waitingPeriodHours: z.coerce.number().int().min(0).default(24),
  dispositionInstructions: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const statusConfig: Record<CremationStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending Authorization',
    className: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  },
  authorized: {
    label: 'Authorized',
    className: 'bg-blue-50 border-blue-200 text-blue-800',
  },
  waiting_period: {
    label: 'Waiting Period',
    className: 'bg-orange-50 border-orange-200 text-orange-800',
  },
  cleared: {
    label: 'Cleared to Proceed',
    className: 'bg-green-50 border-green-200 text-green-800',
  },
  performed: {
    label: 'Cremation Performed',
    className: 'bg-muted border text-muted-foreground',
  },
};

function waitingPeriodRemaining(authorizedAt: string, waitingPeriodHours: number): number {
  const authorized = new Date(authorizedAt).getTime();
  const clearEligible = authorized + waitingPeriodHours * 60 * 60 * 1000;
  return Math.max(0, clearEligible - Date.now());
}

function formatHoursRemaining(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

function CremationAuthContent({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['cremation-auth', caseId],
    queryFn: () =>
      apiClient
        .get(`/cases/${caseId}/cremation-auth`)
        .then((r) => r.data)
        .catch((err) => {
          if (err?.response?.status === 404) return null;
          throw err;
        }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { waitingPeriodHours: 24 },
  });

  useEffect(() => {
    if (data) {
      reset({
        authorizerName: data.authorizerName ?? '',
        authorizerRelationship: data.authorizerRelationship ?? '',
        authorizerPhone: data.authorizerPhone ?? '',
        authorizerEmail: data.authorizerEmail ?? '',
        waitingPeriodHours: data.waitingPeriodHours ?? 24,
        dispositionInstructions: data.dispositionInstructions ?? '',
        notes: data.notes ?? '',
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        authorizerPhone: values.authorizerPhone || null,
        authorizerEmail: values.authorizerEmail || null,
        dispositionInstructions: values.dispositionInstructions || null,
        notes: values.notes || null,
      };
      return data
        ? apiClient.patch(`/cases/${caseId}/cremation-auth`, payload)
        : apiClient.post(`/cases/${caseId}/cremation-auth`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cremation-auth', caseId] });
      toast.success('Cremation authorization saved.');
    },
    onError: () => toast.error('Failed to save cremation authorization.'),
  });

  const authorizeMutation = useMutation({
    mutationFn: () =>
      apiClient.patch(`/cases/${caseId}/cremation-auth`, {
        authorizedAt: new Date().toISOString(),
        status: 'authorized',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cremation-auth', caseId] });
      toast.success('Marked as authorized.');
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => apiClient.post(`/cases/${caseId}/cremation-auth/clear`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cremation-auth', caseId] });
      toast.success('Waiting period cleared.');
    },
    onError: () => toast.error('Failed to clear waiting period.'),
  });

  const performedMutation = useMutation({
    mutationFn: () => apiClient.post(`/cases/${caseId}/cremation-auth/performed`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cremation-auth', caseId] });
      toast.success('Cremation recorded as performed.');
      setConfirmOpen(false);
    },
    onError: () => toast.error('Failed to record cremation.'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const status: CremationStatus | null = data?.status ?? null;
  const isPerformed = status === 'performed';
  const isReadOnly = isPerformed;

  const msRemaining =
    status === 'authorized' && data?.authorizedAt
      ? waitingPeriodRemaining(data.authorizedAt, data.waitingPeriodHours ?? 24)
      : 0;
  const canClear = msRemaining === 0;

  const statusBanner = status ? (
    <div
      className={`rounded-md border px-4 py-3 text-sm font-medium mb-6 ${statusConfig[status].className}`}
      role="status"
    >
      {statusConfig[status].label}
      {status === 'authorized' && !canClear && (
        <span className="ml-2 font-normal opacity-75">— {formatHoursRemaining(msRemaining)}</span>
      )}
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {statusBanner}

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Legal notice:</strong> Cremation is irreversible. Ensure all authorizations are
        complete before proceeding.
      </div>

      <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} noValidate className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authorizer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorizerName">Authorizer Name</Label>
                <Input
                  id="authorizerName"
                  {...register('authorizerName')}
                  aria-invalid={!!errors.authorizerName}
                  disabled={isReadOnly}
                />
                {errors.authorizerName && (
                  <p className="text-destructive text-sm mt-1">{errors.authorizerName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="authorizerRelationship">Relationship to Deceased</Label>
                <Input
                  id="authorizerRelationship"
                  {...register('authorizerRelationship')}
                  aria-invalid={!!errors.authorizerRelationship}
                  disabled={isReadOnly}
                />
                {errors.authorizerRelationship && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.authorizerRelationship.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="authorizerPhone">Phone (optional)</Label>
                <Input
                  id="authorizerPhone"
                  type="tel"
                  {...register('authorizerPhone')}
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <Label htmlFor="authorizerEmail">Email (optional)</Label>
                <Input
                  id="authorizerEmail"
                  type="email"
                  {...register('authorizerEmail')}
                  aria-invalid={!!errors.authorizerEmail}
                  disabled={isReadOnly}
                />
                {errors.authorizerEmail && (
                  <p className="text-destructive text-sm mt-1">{errors.authorizerEmail.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions &amp; Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="waitingPeriodHours">Waiting Period (hours)</Label>
              <Input
                id="waitingPeriodHours"
                type="number"
                min={0}
                {...register('waitingPeriodHours')}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <Label htmlFor="dispositionInstructions">Disposition Instructions</Label>
              <textarea
                id="dispositionInstructions"
                {...register('dispositionInstructions')}
                rows={3}
                placeholder="What to do with the remains..."
                disabled={isReadOnly}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                placeholder="Additional notes..."
                disabled={isReadOnly}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        {!isReadOnly && (
          <Button type="submit" disabled={isSubmitting || saveMutation.isPending}>
            {isSubmitting || saveMutation.isPending
              ? 'Saving...'
              : !data
                ? 'Create Authorization'
                : 'Save Changes'}
          </Button>
        )}
      </form>

      {/* Workflow actions */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Workflow Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {status === 'pending' && (
              <Button
                variant="default"
                onClick={() => authorizeMutation.mutate()}
                disabled={authorizeMutation.isPending}
              >
                {authorizeMutation.isPending ? 'Updating...' : 'Mark as Authorized'}
              </Button>
            )}

            {status === 'authorized' && (
              <div className="flex items-center gap-3">
                <Button
                  variant="default"
                  onClick={() => clearMutation.mutate()}
                  disabled={!canClear || clearMutation.isPending}
                >
                  {clearMutation.isPending
                    ? 'Clearing...'
                    : canClear
                      ? 'Mark Cleared'
                      : `Waiting period: ${formatHoursRemaining(msRemaining)}`}
                </Button>
              </div>
            )}

            {status === 'cleared' && (
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                Record Cremation Performed
              </Button>
            )}

            {status === 'performed' && data.cremationPerformedAt && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Cremation performed:{' '}
                  <span className="text-foreground font-medium">
                    {formatDate(data.cremationPerformedAt)}
                  </span>
                </p>
                {data.cremationClearedAt && (
                  <p>
                    Cleared at:{' '}
                    <span className="text-foreground font-medium">
                      {formatDate(data.cremationClearedAt)}
                    </span>
                  </p>
                )}
                {data.authorizedAt && (
                  <p>
                    Authorized at:{' '}
                    <span className="text-foreground font-medium">
                      {formatDate(data.authorizedAt)}
                    </span>
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cremation Performed</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action is irreversible and will permanently mark cremation as performed. Are you
            sure all authorizations are complete?
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => performedMutation.mutate()}
              disabled={performedMutation.isPending}
            >
              {performedMutation.isPending ? 'Recording...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CremationAuthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PageHeader title="Cremation Authorization" />
      <CremationAuthContent caseId={id} />
    </div>
  );
}
