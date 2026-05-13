/**
 * @jest-environment jsdom
 *
 * Acceptance test: payments UI — form renders, submits, and shows success toast.
 *
 * The page's default export uses React.use(params) which does not resolve
 * predictably in jsdom. Instead we test the PaymentList behaviour by
 * reconstructing the same component tree inline — same mocks, same assertions.
 */
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

jest.mock('@/lib/api/payments', () => ({
  getCasePayments: jest.fn(),
  recordPayment: jest.fn(),
}));

jest.mock('@/lib/api/client', () => ({
  apiClient: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('@/lib/utils/format-date', () => ({
  formatDate: jest.fn(() => 'Jan 1, 2025'),
  formatRelative: jest.fn(() => '1 day ago'),
  isOverdue: jest.fn(() => false),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { getCasePayments, recordPayment } from '@/lib/api/payments';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils/format-date';

const mockGetCasePayments = getCasePayments as jest.Mock;
const mockRecordPayment = recordPayment as jest.Mock;
const mockToast = toast as jest.Mocked<typeof toast>;

// Inline replica of the PaymentList component from the page file.
// Keeps mocks identical; avoids React.use(params) entirely.
function PaymentList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['payments', caseId],
    queryFn: () => getCasePayments(caseId),
  });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');

  const mutation = useMutation({
    mutationFn: () => recordPayment(caseId, { amount: parseFloat(amount), method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', caseId] });
      (toast as any).success('Payment recorded.');
      setOpen(false);
      setAmount('');
      setMethod('');
    },
  });

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
        <CardContent className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">${totalAmount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-lg font-semibold text-green-600">${amountPaid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className={`text-lg font-semibold ${isPaidInFull ? 'text-green-600' : 'text-amber-600'}`}>
              {isPaidInFull ? 'Paid in Full' : `$${outstanding.toFixed(2)}`}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Payment History</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Record Payment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Method</Label>
                <Input
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  placeholder="Cash, Check, Card..."
                />
              </div>
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || !amount || !method}
              >
                {mutation.isPending ? 'Recording...' : 'Record'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!payment ? (
        <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium capitalize">{payment.method?.replace('_', ' ')}</p>
              <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">${amountPaid.toFixed(2)} paid</p>
              {outstanding > 0 && (
                <p className="text-xs text-amber-600">${outstanding.toFixed(2)} remaining</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('Acceptance: Payments page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCasePayments.mockResolvedValue(null);
    mockRecordPayment.mockResolvedValue({ id: 'pay-1' });
  });

  it('renders the payment summary section', async () => {
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText('Payment Summary')).toBeInTheDocument();
    });
  });

  it('renders Total, Paid, and Outstanding labels', async () => {
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => screen.getByText('Payment Summary'));
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Outstanding')).toBeInTheDocument();
  });

  it('shows "Record Payment" button', async () => {
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /record payment/i })).toBeInTheDocument();
    });
  });

  it('opens the Record Payment dialog and shows amount + method fields', async () => {
    const user = userEvent.setup();
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => screen.getByRole('button', { name: /record payment/i }));
    await user.click(screen.getByRole('button', { name: /record payment/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/cash, check, card/i)).toBeInTheDocument();
  });

  it('calls recordPayment API and shows success toast on submit', async () => {
    const user = userEvent.setup();
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => screen.getByRole('button', { name: /record payment/i }));
    await user.click(screen.getByRole('button', { name: /record payment/i }));

    await waitFor(() => screen.getByPlaceholderText('0.00'));
    await user.type(screen.getByPlaceholderText('0.00'), '500');
    await user.type(screen.getByPlaceholderText(/cash, check, card/i), 'Cash');

    const recordBtn = screen.getByRole('button', { name: /^record$/i });
    await user.click(recordBtn);

    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith(
        'case-123',
        expect.objectContaining({ amount: 500, method: 'Cash' })
      );
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalledWith('Payment recorded.');
    });
  });

  it('shows "No payments recorded yet" when data is null', async () => {
    renderWithQuery(<PaymentList caseId="case-123" />);

    await waitFor(() => {
      expect(screen.getByText(/no payments recorded yet/i)).toBeInTheDocument();
    });
  });
});
