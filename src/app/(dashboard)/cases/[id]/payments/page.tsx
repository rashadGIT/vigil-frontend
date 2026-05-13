'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Download } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getCasePayments, recordPayment } from '@/lib/api/payments';
import { formatDate } from '@/lib/utils/format-date';

const paymentSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Amount is required' }).positive('Amount must be greater than zero'),
  method: z.enum(['Cash', 'Check', 'Card', 'Wire', 'Other'], { errorMap: () => ({ message: 'Payment method is required' }) }),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

function PaymentList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });

  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
  });

  const mutation = useMutation({
    mutationFn: (values: PaymentFormValues) =>
      recordPayment(caseId, { amount: values.amount, method: values.method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      toast.success('Payment recorded.');
      setOpen(false);
      reset();
    },
  });

  const onSubmit = (values: PaymentFormValues) => mutation.mutate(values);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const payment = data as any;
  const totalAmount = Number(payment?.totalAmount ?? 0);
  const amountPaid = Number(payment?.amountPaid ?? 0);
  const outstanding = Number(payment?.outstanding ?? totalAmount - amountPaid);
  const isPaidInFull = outstanding <= 0 && totalAmount > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent
          className="grid grid-cols-3 gap-4 text-center"
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-[hsl(var(--success))]">${amountPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={`text-lg font-semibold ${isPaidInFull ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>
              {isPaidInFull ? 'Paid in Full' : `$${outstanding.toFixed(2)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Payment History</h3>
        <div className="flex items-center gap-2">
          {payment && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const rows = [
                  ['Case ID', 'Total', 'Paid', 'Outstanding', 'Method', 'Date'],
                  [
                    caseId,
                    totalAmount.toFixed(2),
                    amountPaid.toFixed(2),
                    Math.max(0, outstanding).toFixed(2),
                    payment.method ?? '',
                    payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '',
                  ],
                ];
                const csv = rows.map((r) => r.join(',')).join('\n');
                const a = document.createElement('a');
                a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `payment-${caseId}.csv`;
                a.click();
              }}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export CSV
            </Button>
          )}
          <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm">Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
              <div>
                <Label htmlFor="payment-amount">Amount</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...register('amount')}
                  aria-invalid={!!errors.amount}
                  aria-describedby={errors.amount ? 'payment-amount-error' : undefined}
                />
                {errors.amount && (
                  <p id="payment-amount-error" className="text-destructive text-sm mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="payment-method">Method</Label>
                <Controller
                  control={control}
                  name="method"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="payment-method" aria-invalid={!!errors.method}>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {['Cash', 'Check', 'Card', 'Wire', 'Other'].map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.method && (
                  <p id="payment-method-error" className="text-destructive text-sm mt-1">
                    {errors.method.message}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? 'Recording...' : 'Record'}
              </Button>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {!payment ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium capitalize">{payment.method?.replace('_', ' ')}</p>
              <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
              {payment.notes && <p className="text-xs text-muted-foreground mt-0.5">{payment.notes}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[hsl(var(--success))]">${amountPaid.toFixed(2)} paid</p>
              {outstanding > 0 && <p className="text-xs text-[hsl(var(--warning))]">${outstanding.toFixed(2)} remaining</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CasePaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <PaymentList caseId={id} />
    </div>
  );
}
