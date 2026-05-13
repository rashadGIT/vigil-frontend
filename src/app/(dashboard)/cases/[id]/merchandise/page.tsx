'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Plus, X } from 'lucide-react';
import { CaseWorkspaceTabs } from '@/components/cases/case-workspace-tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getMerchandise,
  getCaseMerchandise,
  addCaseMerchandise,
  removeCaseMerchandise,
  type MerchandiseItem,
} from '@/lib/api/merchandise';

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function AddItemInlineForm({
  item,
  caseId,
  onDone,
}: {
  item: MerchandiseItem;
  caseId: string;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      addCaseMerchandise(caseId, {
        itemId: item.id,
        quantity,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-merchandise', caseId] });
      toast.success(`${item.name} added to case.`);
      onDone();
    },
    onError: () => toast.error('Failed to add item.'),
  });

  return (
    <div className="mt-2 p-3 border rounded-md bg-muted/40 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`qty-${item.id}`} className="text-xs">Quantity</Label>
          <Input
            id={`qty-${item.id}`}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`notes-${item.id}`} className="text-xs">Notes</Label>
          <Input
            id={`notes-${item.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional"
            className="h-8"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-7 text-xs" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Adding...' : 'Add to Case'}
        </Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onDone}>Cancel</Button>
      </div>
    </div>
  );
}

function CaseMerchandisePage({ caseId }: { caseId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const { data: selections = [], isLoading: selectionsLoading } = useQuery({
    queryKey: ['case-merchandise', caseId],
    queryFn: () => getCaseMerchandise(caseId),
  });

  const { data: catalog = [], isLoading: catalogLoading } = useQuery({
    queryKey: ['merchandise'],
    queryFn: () => getMerchandise(),
  });

  const removeMutation = useMutation({
    mutationFn: (selectionId: string) => removeCaseMerchandise(caseId, selectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-merchandise', caseId] });
      toast.success('Item removed.');
    },
    onError: () => toast.error('Failed to remove item.'),
  });

  const selectedItemIds = new Set(selections.map((s) => s.item.id));

  const filteredCatalog = catalog.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const total = selections.reduce(
    (sum, s) => sum + s.item.retailPrice * s.quantity,
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Merchandise" />

      {/* Selected Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Items</CardTitle>
        </CardHeader>
        <CardContent>
          {selectionsLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : selections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items selected yet.</p>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left font-medium">Item</th>
                    <th className="px-4 py-2 text-left font-medium">Category</th>
                    <th className="px-4 py-2 text-right font-medium">Qty</th>
                    <th className="px-4 py-2 text-right font-medium">Price</th>
                    <th className="px-4 py-2 text-right font-medium">Subtotal</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {selections.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-2">
                        <p className="font-medium">{s.item.name}</p>
                        {s.notes && <p className="text-xs text-muted-foreground">{s.notes}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <Badge variant="outline" className="text-xs capitalize">{s.item.category}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{s.quantity}</td>
                      <td className="px-4 py-2 text-right">{formatPrice(s.item.retailPrice)}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        {formatPrice(s.item.retailPrice * s.quantity)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMutation.mutate(s.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/30">
                    <td colSpan={4} className="px-4 py-2 text-sm font-medium text-right">Total</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatPrice(total)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add from Catalog */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add from Catalog</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {catalogLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items match your search.</p>
          ) : (
            <div className="space-y-1">
              {filteredCatalog.map((item) => {
                const alreadyAdded = selectedItemIds.has(item.id);
                const isExpanded = expandedItemId === item.id;

                return (
                  <div key={item.id} className="rounded-md border">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
                            <span className="text-xs text-muted-foreground">{formatPrice(item.retailPrice)}</span>
                          </div>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-xs text-muted-foreground shrink-0">Added</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs shrink-0"
                          onClick={() =>
                            setExpandedItemId(isExpanded ? null : item.id)
                          }
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="px-3 pb-3">
                        <AddItemInlineForm
                          item={item}
                          caseId={caseId}
                          onDone={() => setExpandedItemId(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CaseMerchandisePageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div>
      <CaseWorkspaceTabs caseId={id} />
      <CaseMerchandisePage caseId={id} />
    </div>
  );
}
