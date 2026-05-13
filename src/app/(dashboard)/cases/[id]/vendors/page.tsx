'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api/client';
import { formatDate } from '@/lib/utils/format-date';

function VendorList({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['vendorAssignments', caseId],
    queryFn: () => apiClient.get(`/cases/${caseId}/vendors`).then((r) => r.data),
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => apiClient.get('/vendors').then((r) => r.data),
  });

  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState('');

  const mutation = useMutation({
    mutationFn: (vendorId: string) => apiClient.post(`/cases/${caseId}/vendors`, { vendorId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendorAssignments', caseId] });
      toast.success('Vendor assigned.');
      setOpen(false);
      setSelectedVendor('');
    },
  });

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Assigned Vendors</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">Assign Vendor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Vendor</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Vendor</Label>
                <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v: any) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => selectedVendor && mutation.mutate(selectedVendor)} disabled={mutation.isPending || !selectedVendor}>
                {mutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendors assigned yet.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {assignments.map((a: any) => (
            <div key={a.id} className="px-4 py-3">
              <p className="text-sm font-medium">{a.vendor?.name || 'Unknown Vendor'}</p>
              <p className="text-xs text-muted-foreground">Assigned {formatDate(a.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CaseVendorsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <VendorList caseId={id} />
    </div>
  );
}
