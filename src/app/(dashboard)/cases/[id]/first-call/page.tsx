'use client';

import { use, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';

const REMOVAL_LOCATIONS = ['Hospital', 'Nursing Facility', 'Residence', 'Medical Examiner', 'Other'] as const;
const AUTH_METHODS = ['Verbal', 'Written', 'Email', 'Fax'] as const;

const schema = z.object({
  calledAt: z.string().min(1, 'Called at is required'),
  calledBy: z.string().optional(),
  callerRelationship: z.string().optional(),
  specialInstructions: z.string().optional(),
  removalAddress: z.string().optional(),
  removalLocation: z.enum(REMOVAL_LOCATIONS).optional(),
  removalAt: z.string().optional(),
  removedBy: z.string().optional(),
  weightEstimate: z.coerce.number().positive().optional().or(z.literal('')),
  authorizedBy: z.string().optional(),
  authorizationMethod: z.enum(AUTH_METHODS).optional(),
});

type FormValues = z.infer<typeof schema>;

function toInputDatetime(val: string | null | undefined): string {
  if (!val) return '';
  return val.slice(0, 16);
}

function FirstCallContent({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['first-call', caseId],
    queryFn: () =>
      apiClient
        .get(`/cases/${caseId}/first-call`)
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
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (data) {
      reset({
        calledAt: toInputDatetime(data.calledAt),
        calledBy: data.calledBy ?? '',
        callerRelationship: data.callerRelationship ?? '',
        specialInstructions: data.specialInstructions ?? '',
        removalAddress: data.removalAddress ?? '',
        removalLocation: data.removalLocation ?? undefined,
        removalAt: toInputDatetime(data.removalAt),
        removedBy: data.removedBy ?? '',
        weightEstimate: data.weightEstimate ?? '',
        authorizedBy: data.authorizedBy ?? '',
        authorizationMethod: data.authorizationMethod ?? undefined,
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        calledAt: values.calledAt || null,
        removalAt: values.removalAt || null,
        weightEstimate: values.weightEstimate !== '' ? Number(values.weightEstimate) : null,
        removalLocation: values.removalLocation || null,
        authorizationMethod: values.authorizationMethod || null,
        calledBy: values.calledBy || null,
        callerRelationship: values.callerRelationship || null,
        specialInstructions: values.specialInstructions || null,
        removalAddress: values.removalAddress || null,
        removedBy: values.removedBy || null,
        authorizedBy: values.authorizedBy || null,
      };
      return data
        ? apiClient.patch(`/cases/${caseId}/first-call`, payload)
        : apiClient.post(`/cases/${caseId}/first-call`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['first-call', caseId] });
      toast.success('First call record saved.');
    },
    onError: () => toast.error('Failed to save first call record.'),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate className="space-y-4">
      {/* Notification section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="calledAt">Called At</Label>
              <Input
                id="calledAt"
                type="datetime-local"
                {...register('calledAt')}
                aria-invalid={!!errors.calledAt}
              />
              {errors.calledAt && (
                <p className="text-destructive text-sm mt-1">{errors.calledAt.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="calledBy">Called By</Label>
              <Input id="calledBy" {...register('calledBy')} />
            </div>
          </div>

          <div>
            <Label htmlFor="callerRelationship">Caller Relationship</Label>
            <Input id="callerRelationship" {...register('callerRelationship')} />
          </div>

          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <textarea
              id="specialInstructions"
              {...register('specialInstructions')}
              rows={3}
              placeholder="Any special instructions noted during the call..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Removal section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Removal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="removalAddress">Removal Address</Label>
            <Input id="removalAddress" {...register('removalAddress')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="removalLocation">Removal Location</Label>
              <Controller
                control={control}
                name="removalLocation"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger id="removalLocation">
                      <SelectValue placeholder="Select location type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REMOVAL_LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="removalAt">Removal At</Label>
              <Input id="removalAt" type="datetime-local" {...register('removalAt')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="removedBy">Removed By</Label>
              <Input id="removedBy" {...register('removedBy')} />
            </div>
            <div>
              <Label htmlFor="weightEstimate">Weight Estimate (lbs, optional)</Label>
              <Input id="weightEstimate" type="number" min={0} {...register('weightEstimate')} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authorization section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Authorization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="authorizedBy">Authorized By</Label>
              <Input id="authorizedBy" {...register('authorizedBy')} />
            </div>
            <div>
              <Label htmlFor="authorizationMethod">Authorization Method</Label>
              <Controller
                control={control}
                name="authorizationMethod"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value ?? ''}>
                    <SelectTrigger id="authorizationMethod">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTH_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={isSubmitting || mutation.isPending}>
        {isSubmitting || mutation.isPending ? 'Saving...' : data ? 'Update' : 'Create'}
      </Button>
    </form>
  );
}

export default function FirstCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PageHeader title="First Call" description="Initial notification and removal record" />
      <FirstCallContent caseId={id} />
    </div>
  );
}
