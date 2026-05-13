'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { getVendors, createVendor, deleteVendor } from '@/lib/api/vendors';
import { VendorType } from '@/types';

function AddVendorDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [vendorType, setVendorType] = useState<VendorType>(VendorType.other);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createVendor({ name, type: vendorType, phone: phone || undefined, email: email || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      toast.success('Vendor added.');
      setOpen(false);
      setName(''); setPhone(''); setEmail('');
      onSuccess();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Vendor</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="font-medium">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vendor name" />
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Type</Label>
            <Select value={vendorType} onValueChange={(v) => setVendorType(v as VendorType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(VendorType).map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
          </div>
          <Button className="w-full" disabled={!name || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? 'Adding...' : 'Add Vendor'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const { data: vendors = [], isLoading } = useQuery({ queryKey: ['vendors'], queryFn: getVendors });

  const deleteMutation = useMutation({
    mutationFn: deleteVendor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vendors'] }); toast.success('Vendor removed.'); },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Vendors" description="Manage your vendor directory." action={<AddVendorDialog onSuccess={() => {}} />} />
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : vendors.length === 0 ? (
        <p className="text-sm text-muted-foreground">No vendors yet. Add your first vendor above.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {vendors.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium text-sm">{v.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">{v.type}</Badge>
                  {v.phone && <span className="text-xs text-muted-foreground">{v.phone}</span>}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(v.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
