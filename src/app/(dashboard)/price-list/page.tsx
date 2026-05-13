'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, ShieldCheck } from 'lucide-react';
import { getPriceList, createPriceListItem, deletePriceListItem } from '@/lib/api/price-list';
import { apiClient } from '@/lib/api/client';
import { PriceCategory } from '@/types';

const categoryLabel: Record<PriceCategory, string> = {
  [PriceCategory.professional_services]: 'Professional Services',
  [PriceCategory.facilities]: 'Facilities',
  [PriceCategory.vehicles]: 'Vehicles',
  [PriceCategory.merchandise]: 'Merchandise',
  [PriceCategory.other]: 'Other',
};

export default function PriceListPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    apiClient.post('/price-list/view').catch(() => {/* non-blocking */});
  }, []);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<PriceCategory>(PriceCategory.professional_services);

  const { data: items = [], isLoading } = useQuery({ queryKey: ['price-list'], queryFn: getPriceList });

  const createMutation = useMutation({
    mutationFn: () => createPriceListItem({ name, category, price: parseFloat(price) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-list'] });
      toast.success('Item added.');
      setOpen(false);
      setName(''); setPrice('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePriceListItem,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['price-list'] }); toast.success('Item removed.'); },
  });

  // Group by category
  const grouped = Object.values(PriceCategory).reduce<Record<PriceCategory, typeof items>>(
    (acc, cat) => ({ ...acc, [cat]: items.filter((i) => i.category === cat) }),
    {} as Record<PriceCategory, typeof items>,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Price List"
        description="FTC General Price List — manage categories and items."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/price-list/audit"><ShieldCheck className="h-4 w-4 mr-2" />Compliance Log</Link>
            </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Item</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Price List Item</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="font-medium">Item Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Direct Cremation" />
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Category</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as PriceCategory)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(PriceCategory).map((c) => (
                        <SelectItem key={c} value={c}>{categoryLabel[c]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Price ($)</Label>
                  <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                </div>
                <Button className="w-full" disabled={!name || !price || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  Add Item
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        Object.entries(grouped).map(([cat, catItems]) =>
          catItems.length === 0 ? null : (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {categoryLabel[cat as PriceCategory]}
              </h3>
              <div className="rounded-md border divide-y">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">${Number(item.price).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )
      )}
    </div>
  );
}
