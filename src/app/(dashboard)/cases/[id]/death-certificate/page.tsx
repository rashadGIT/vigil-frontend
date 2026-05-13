'use client';

import { use, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/ui/status-pill';
import { apiClient } from '@/lib/api/client';

const schema = z.object({
  physicianName: z.string().min(1, 'Physician name is required'),
  dateOfDeath: z.string().min(1, 'Date of death is required'),
  placeOfDeath: z.string().min(1, 'Place of death is required'),
  causeOfDeath: z.string().optional(),
  certifiedCopiesOrdered: z.coerce.number().int().min(0).default(0),
  certifiedCopiesReceived: z.coerce.number().int().min(0).default(0),
  physicianSignedAt: z.string().optional(),
  edrsFiledAt: z.string().optional(),
  stateFiledAt: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function toInputDatetime(val: string | null | undefined): string {
  if (!val) return '';
  return val.slice(0, 16);
}

function DeathCertificateContent({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['death-certificate', caseId],
    queryFn: () =>
      apiClient
        .get(`/cases/${caseId}/death-certificate`)
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      certifiedCopiesOrdered: 0,
      certifiedCopiesReceived: 0,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        physicianName: data.physicianName ?? '',
        dateOfDeath: data.dateOfDeath ? data.dateOfDeath.slice(0, 10) : '',
        placeOfDeath: data.placeOfDeath ?? '',
        causeOfDeath: data.causeOfDeath ?? '',
        certifiedCopiesOrdered: data.certifiedCopiesOrdered ?? 0,
        certifiedCopiesReceived: data.certifiedCopiesReceived ?? 0,
        physicianSignedAt: toInputDatetime(data.physicianSignedAt),
        edrsFiledAt: toInputDatetime(data.edrsFiledAt),
        stateFiledAt: toInputDatetime(data.stateFiledAt),
        notes: data.notes ?? '',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        physicianSignedAt: values.physicianSignedAt || null,
        edrsFiledAt: values.edrsFiledAt || null,
        stateFiledAt: values.stateFiledAt || null,
        causeOfDeath: values.causeOfDeath || null,
        notes: values.notes || null,
      };
      return data
        ? apiClient.patch(`/cases/${caseId}/death-certificate`, payload)
        : apiClient.post(`/cases/${caseId}/death-certificate`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['death-certificate', caseId] });
      toast.success('Death certificate saved.');
    },
    onError: () => toast.error('Failed to save death certificate.'),
  });

  const watchedValues = watch();
  const copiesOrdered = watchedValues.certifiedCopiesOrdered ?? 0;
  const copiesReceived = watchedValues.certifiedCopiesReceived ?? 0;

  const steps = [
    { label: 'Physician signed', done: !!watchedValues.physicianSignedAt },
    { label: 'EDRS filed', done: !!watchedValues.edrsFiledAt },
    { label: 'State filed', done: !!watchedValues.stateFiledAt },
    { label: 'Certified copies received', done: Number(copiesReceived) > 0 },
  ];

  const statusKind = steps.every((s) => s.done)
    ? 'completed'
    : steps.some((s) => s.done)
      ? 'in_progress'
      : 'pending';

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="physicianName">Physician Name</Label>
                  <Input
                    id="physicianName"
                    {...register('physicianName')}
                    aria-invalid={!!errors.physicianName}
                  />
                  {errors.physicianName && (
                    <p className="text-destructive text-sm mt-1">{errors.physicianName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfDeath">Date of Death</Label>
                  <Input
                    id="dateOfDeath"
                    type="date"
                    {...register('dateOfDeath')}
                    aria-invalid={!!errors.dateOfDeath}
                  />
                  {errors.dateOfDeath && (
                    <p className="text-destructive text-sm mt-1">{errors.dateOfDeath.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="placeOfDeath">Place of Death</Label>
                <Input
                  id="placeOfDeath"
                  {...register('placeOfDeath')}
                  aria-invalid={!!errors.placeOfDeath}
                />
                {errors.placeOfDeath && (
                  <p className="text-destructive text-sm mt-1">{errors.placeOfDeath.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="causeOfDeath">Cause of Death (optional)</Label>
                <Input id="causeOfDeath" {...register('causeOfDeath')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certifiedCopiesOrdered">Certified Copies Ordered</Label>
                  <Input
                    id="certifiedCopiesOrdered"
                    type="number"
                    min={0}
                    {...register('certifiedCopiesOrdered')}
                  />
                </div>
                <div>
                  <Label htmlFor="certifiedCopiesReceived">Certified Copies Received</Label>
                  <Input
                    id="certifiedCopiesReceived"
                    type="number"
                    min={0}
                    {...register('certifiedCopiesReceived')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filing Timestamps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="physicianSignedAt">Physician Signed At (optional)</Label>
                <Input id="physicianSignedAt" type="datetime-local" {...register('physicianSignedAt')} />
              </div>
              <div>
                <Label htmlFor="edrsFiledAt">EDRS Filed At (optional)</Label>
                <Input id="edrsFiledAt" type="datetime-local" {...register('edrsFiledAt')} />
              </div>
              <div>
                <Label htmlFor="stateFiledAt">State Filed At (optional)</Label>
                <Input id="stateFiledAt" type="datetime-local" {...register('stateFiledAt')} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="notes"
                {...register('notes')}
                rows={4}
                placeholder="Additional notes..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? 'Saving...' : data ? 'Update' : 'Create'}
          </Button>
        </div>

        {/* Right: status summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusPill kind={statusKind} />

              <ul className="space-y-2 mt-2">
                {steps.map((step) => (
                  <li key={step.label} className="flex items-center gap-2 text-sm">
                    <span
                      className={step.done ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}
                      aria-hidden="true"
                    >
                      {step.done ? '✓' : '☐'}
                    </span>
                    <span className={step.done ? 'text-foreground' : 'text-muted-foreground'}>
                      {step.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="pt-2 border-t text-sm text-muted-foreground">
                Certified Copies:{' '}
                <span className="text-foreground font-medium">
                  {copiesOrdered} ordered / {copiesReceived} received
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}

export default function DeathCertificatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PageHeader title="Death Certificate" />
      <DeathCertificateContent caseId={id} />
    </div>
  );
}
