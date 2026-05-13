'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getPreNeedArrangements,
  createPreNeedArrangement,
  convertPreNeed,
  type PreNeedArrangement,
  type PreNeedStatus,
  type ServiceType,
  type FundingType,
} from '@/lib/api/preneed';
import { formatDate } from '@/lib/utils/format-date';

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: 'burial', label: 'Burial' },
  { value: 'cremation', label: 'Cremation' },
  { value: 'graveside', label: 'Graveside' },
  { value: 'memorial', label: 'Memorial' },
];

const FUNDING_TYPES: { value: FundingType; label: string }[] = [
  { value: 'Insurance', label: 'Insurance' },
  { value: 'Trust', label: 'Trust' },
  { value: 'Cash', label: 'Cash' },
  { value: 'Combination', label: 'Combination' },
];

const arrangementSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dob: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  serviceType: z.enum(['burial', 'cremation', 'graveside', 'memorial']),
  fundingType: z.enum(['Insurance', 'Trust', 'Cash', 'Combination']),
  insuranceCompany: z.string().optional(),
  policyNumber: z.string().optional(),
  faceValue: z.coerce.number().nonnegative().optional().or(z.literal('')),
  notes: z.string().optional(),
});

type ArrangementFormValues = z.infer<typeof arrangementSchema>;

const STATUS_BADGE: Record<PreNeedStatus, string> = {
  active: 'bg-green-100 text-green-800',
  converted: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-muted text-muted-foreground',
};

function NewArrangementDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ArrangementFormValues>({
    resolver: zodResolver(arrangementSchema),
    defaultValues: { serviceType: 'burial', fundingType: 'Insurance' },
  });

  const fundingType = watch('fundingType');

  const mutation = useMutation({
    mutationFn: (values: ArrangementFormValues) =>
      createPreNeedArrangement({
        firstName: values.firstName,
        lastName: values.lastName,
        dob: values.dob || undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        address: values.address || undefined,
        serviceType: values.serviceType,
        fundingType: values.fundingType,
        insuranceCompany: values.insuranceCompany || undefined,
        policyNumber: values.policyNumber || undefined,
        faceValue: values.faceValue ? Number(values.faceValue) : undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preneed'] });
      toast.success('Pre-need arrangement created.');
      setOpen(false);
      reset();
      onSuccess();
    },
    onError: () => toast.error('Failed to create arrangement.'),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Arrangement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Pre-Need Arrangement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-3 pt-1" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pn-first">First Name</Label>
              <Input id="pn-first" {...register('firstName')} aria-invalid={!!errors.firstName} />
              {errors.firstName && <p className="text-destructive text-sm">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="pn-last">Last Name</Label>
              <Input id="pn-last" {...register('lastName')} aria-invalid={!!errors.lastName} />
              {errors.lastName && <p className="text-destructive text-sm">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pn-dob">Date of Birth</Label>
            <Input id="pn-dob" type="date" {...register('dob')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pn-phone">Phone</Label>
              <Input id="pn-phone" {...register('phone')} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pn-email">Email</Label>
              <Input id="pn-email" {...register('email')} placeholder="Optional" />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pn-address">Address</Label>
            <Input id="pn-address" {...register('address')} placeholder="Optional" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pn-service-type">Service Type</Label>
              <Controller
                control={control}
                name="serviceType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="pn-service-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pn-funding-type">Funding Type</Label>
              <Controller
                control={control}
                name="fundingType"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="pn-funding-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FUNDING_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {(fundingType === 'Insurance' || fundingType === 'Combination') && (
            <div className="space-y-1">
              <Label htmlFor="pn-insurance-co">Insurance Company</Label>
              <Input id="pn-insurance-co" {...register('insuranceCompany')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="pn-policy">Policy Number</Label>
              <Input id="pn-policy" {...register('policyNumber')} placeholder="Optional" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="pn-face-value">Face Value</Label>
              <Input id="pn-face-value" type="number" step="0.01" min="0" {...register('faceValue')} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="pn-notes">Notes</Label>
            <textarea
              id="pn-notes"
              {...register('notes')}
              rows={3}
              placeholder="Optional"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Arrangement'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ConvertConfirmDialog({
  arrangement,
  open,
  onOpenChange,
}: {
  arrangement: PreNeedArrangement;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => convertPreNeed(arrangement.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['preneed'] });
      toast.success('Converted to active case.');
      onOpenChange(false);
      router.push(`/cases/${data.caseId}`);
    },
    onError: () => toast.error('Failed to convert arrangement.'),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Active Case</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Convert {arrangement.firstName} {arrangement.lastName}&apos;s pre-need arrangement to an active case?
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Converting...' : 'Convert to Case'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const FILTER_TABS: { value: PreNeedStatus | 'all'; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'converted', label: 'Converted' },
  { value: 'all', label: 'All' },
];

export default function PreNeedPage() {
  const [statusFilter, setStatusFilter] = useState<PreNeedStatus | 'all'>('active');
  const [convertTarget, setConvertTarget] = useState<PreNeedArrangement | null>(null);

  const { data: arrangements = [], isLoading } = useQuery({
    queryKey: ['preneed', statusFilter],
    queryFn: () =>
      getPreNeedArrangements(
        statusFilter !== 'all' ? { status: statusFilter as PreNeedStatus } : undefined,
      ),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pre-Need Arrangements"
        description="Pre-arranged funeral records"
        action={<NewArrangementDialog onSuccess={() => {}} />}
      />

      {/* Filter tabs */}
      <div className="flex gap-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Convert dialog */}
      {convertTarget && (
        <ConvertConfirmDialog
          arrangement={convertTarget}
          open={!!convertTarget}
          onOpenChange={(v) => { if (!v) setConvertTarget(null); }}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : arrangements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No arrangements found.</p>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Client Name</th>
                <th className="px-4 py-3 text-left font-medium">DOB</th>
                <th className="px-4 py-3 text-left font-medium">Service Type</th>
                <th className="px-4 py-3 text-left font-medium">Funding Type</th>
                <th className="px-4 py-3 text-left font-medium">Policy #</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {arrangements.map((a) => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {a.dob ? formatDate(a.dob) : '—'}
                  </td>
                  <td className="px-4 py-3 capitalize">{a.serviceType}</td>
                  <td className="px-4 py-3">{a.fundingType}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.policyNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGE[a.status]}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setConvertTarget(a)}
                      >
                        Convert to Case
                      </Button>
                    )}
                    {a.status === 'converted' && a.convertedCaseId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => window.location.href = `/cases/${a.convertedCaseId}`}
                      >
                        View Case
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
