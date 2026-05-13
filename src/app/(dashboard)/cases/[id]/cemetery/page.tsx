'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CheckCircle, Circle } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getCemeteryRecord,
  upsertCemeteryRecord,
  type IntermentType,
} from '@/lib/api/cemetery';

const INTERMENT_TYPES: { value: IntermentType; label: string }[] = [
  { value: 'Ground', label: 'Ground' },
  { value: 'Mausoleum', label: 'Mausoleum' },
  { value: 'Columbarium', label: 'Columbarium' },
  { value: 'Scattering Garden', label: 'Scattering Garden' },
];

const cemeterySchema = z.object({
  cemeteryName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  section: z.string().optional(),
  lot: z.string().optional(),
  grave: z.string().optional(),
  intermentType: z.enum(['Ground', 'Mausoleum', 'Columbarium', 'Scattering Garden']).optional(),
  openingClosingOrdered: z.boolean().default(false),
  intermentScheduledAt: z.string().optional(),
  permitNumber: z.string().optional(),
  permitObtained: z.boolean().default(false),
  intermentCompleted: z.boolean().default(false),
  notes: z.string().optional(),
});

type CemeteryFormValues = z.infer<typeof cemeterySchema>;

function StatusIndicator({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className={`text-sm ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

function CemeteryForm({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data: record, isLoading } = useQuery({
    queryKey: ['cemetery', caseId],
    queryFn: () => getCemeteryRecord(caseId),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<CemeteryFormValues>({
    resolver: zodResolver(cemeterySchema),
    values: record
      ? {
          cemeteryName: record.cemeteryName ?? '',
          address: record.address ?? '',
          phone: record.phone ?? '',
          section: record.section ?? '',
          lot: record.lot ?? '',
          grave: record.grave ?? '',
          intermentType: record.intermentType,
          openingClosingOrdered: record.openingClosingOrdered,
          intermentScheduledAt: record.intermentScheduledAt
            ? record.intermentScheduledAt.slice(0, 16)
            : '',
          permitNumber: record.permitNumber ?? '',
          permitObtained: record.permitObtained,
          intermentCompleted: record.intermentCompleted,
          notes: record.notes ?? '',
        }
      : undefined,
  });

  const openingClosingOrdered = watch('openingClosingOrdered');
  const permitObtained = watch('permitObtained');
  const intermentCompleted = watch('intermentCompleted');
  const intermentScheduledAt = watch('intermentScheduledAt');

  const mutation = useMutation({
    mutationFn: (values: CemeteryFormValues) =>
      upsertCemeteryRecord(
        caseId,
        {
          cemeteryName: values.cemeteryName || undefined,
          address: values.address || undefined,
          phone: values.phone || undefined,
          section: values.section || undefined,
          lot: values.lot || undefined,
          grave: values.grave || undefined,
          intermentType: values.intermentType,
          openingClosingOrdered: values.openingClosingOrdered,
          intermentScheduledAt: values.intermentScheduledAt || undefined,
          permitNumber: values.permitNumber || undefined,
          permitObtained: values.permitObtained,
          intermentCompleted: values.intermentCompleted,
          notes: values.notes || undefined,
        },
        !!record,
      ),
    onSuccess: (updated) => {
      queryClient.setQueryData(['cemetery', caseId], updated);
      toast.success('Cemetery record saved.');
      reset(undefined, { keepValues: true });
    },
    onError: () => toast.error('Failed to save cemetery record.'),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      {/* Status summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatusIndicator label="Opening & Closing Ordered" done={openingClosingOrdered} />
          <StatusIndicator label="Permit Obtained" done={permitObtained} />
          <StatusIndicator label="Interment Scheduled" done={!!intermentScheduledAt} />
          <StatusIndicator label="Interment Completed" done={intermentCompleted} />
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cemetery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cem-name">Cemetery Name</Label>
                <Input id="cem-name" {...register('cemeteryName')} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cem-phone">Phone</Label>
                <Input id="cem-phone" {...register('phone')} placeholder="Optional" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cem-address">Address</Label>
              <Input id="cem-address" {...register('address')} placeholder="Optional" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cem-section">Section</Label>
                <Input id="cem-section" {...register('section')} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cem-lot">Lot</Label>
                <Input id="cem-lot" {...register('lot')} placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cem-grave">Grave</Label>
                <Input id="cem-grave" {...register('grave')} placeholder="Optional" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cem-interment-type">Interment Type</Label>
                <Controller
                  control={control}
                  name="intermentType"
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''}
                    >
                      <SelectTrigger id="cem-interment-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERMENT_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cem-scheduled-at">Interment Scheduled At</Label>
                <Input
                  id="cem-scheduled-at"
                  type="datetime-local"
                  {...register('intermentScheduledAt')}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cem-permit">Permit Number</Label>
              <Input id="cem-permit" {...register('permitNumber')} placeholder="Optional" />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('openingClosingOrdered')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Opening &amp; Closing Ordered</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('permitObtained')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Permit Obtained</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('intermentCompleted')}
                  className="h-4 w-4 rounded border-input"
                />
                <span className="text-sm">Interment Completed</span>
              </label>
            </div>

            <div className="space-y-1">
              <Label htmlFor="cem-notes">Notes</Label>
              <textarea
                id="cem-notes"
                {...register('notes')}
                rows={3}
                placeholder="Optional"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseCemeteryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PageHeader title="Cemetery" description="Interment and burial coordination" />
      <CemeteryForm caseId={id} />
    </div>
  );
}
