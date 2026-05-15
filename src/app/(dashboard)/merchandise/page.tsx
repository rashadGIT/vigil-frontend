'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Package, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  getMerchandise,
  createMerchandise,
  updateMerchandise,
  deleteMerchandise,
  type MerchandiseItem,
  type MerchandiseCategory,
} from '@/lib/api/merchandise';

const CATEGORIES: { value: MerchandiseCategory; label: string }[] = [
  { value: 'casket', label: 'Casket' },
  { value: 'urn', label: 'Urn' },
  { value: 'vault', label: 'Vault' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'flowers', label: 'Flowers' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'other', label: 'Other' },
];

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: z.enum(['casket', 'urn', 'vault', 'clothing', 'flowers', 'stationery', 'other']),
  retailPrice: z.coerce.number({ invalid_type_error: 'Retail price is required' }).nonnegative(),
  costPrice: z.coerce.number().nonnegative().optional().or(z.literal('')),
  sku: z.string().optional(),
  description: z.string().optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

function formatPrice(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function ItemDialog({
  item,
  open,
  onOpenChange,
}: {
  item?: MerchandiseItem;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!item;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: item
      ? {
          name: item.name,
          category: item.category,
          retailPrice: item.retailPrice,
          costPrice: item.costPrice ?? '',
          sku: item.sku ?? '',
          description: item.description ?? '',
        }
      : { category: 'casket', retailPrice: 0 },
  });

  const createMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      createMerchandise({
        name: values.name,
        category: values.category,
        retailPrice: values.retailPrice,
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        sku: values.sku || undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise'] });
      toast.success('Item added to catalog.');
      onOpenChange(false);
      reset();
    },
    onError: () => toast.error('Failed to add item.'),
  });

  const editMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      updateMerchandise(item!.id, {
        name: values.name,
        category: values.category,
        retailPrice: values.retailPrice,
        costPrice: values.costPrice ? Number(values.costPrice) : undefined,
        sku: values.sku || undefined,
        description: values.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise'] });
      toast.success('Item updated.');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to update item.'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteMerchandise(item!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchandise'] });
      toast.success('Item removed.');
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to remove item.'),
  });

  const onSubmit = (values: ItemFormValues) => {
    if (isEdit) editMutation.mutate(values);
    else createMutation.mutate(values);
  };

  const isPending = createMutation.isPending || editMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Item' : 'Add Item'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
          <div className="space-y-1">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" {...register('name')} aria-invalid={!!errors.name} />
            {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="item-category">Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="item-retail-price">Retail Price</Label>
              <Input id="item-retail-price" type="number" step="0.01" min="0" {...register('retailPrice')} aria-invalid={!!errors.retailPrice} />
              {errors.retailPrice && <p className="text-destructive text-sm">{errors.retailPrice.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="item-cost-price">Cost Price <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="item-cost-price" type="number" step="0.01" min="0" {...register('costPrice')} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="item-sku">SKU <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="item-sku" {...register('sku')} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="item-description">Description <span className="text-muted-foreground">(optional)</span></Label>
            <textarea
              id="item-description"
              {...register('description')}
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button type="submit" disabled={isPending} className={isEdit ? '' : 'w-full'}>
              {isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function MerchandiseCatalogPage() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<MerchandiseCategory | 'all'>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState<MerchandiseItem | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['merchandise', activeCategory],
    queryFn: () =>
      getMerchandise(
        activeCategory !== 'all' ? { category: activeCategory as MerchandiseCategory } : undefined,
      ),
  });

  const toggleStockMutation = useMutation({
    mutationFn: ({ id, inStock }: { id: string; inStock: boolean }) =>
      updateMerchandise(id, { inStock }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merchandise'] }),
    onError: () => toast.error('Failed to update stock status.'),
  });

  const filterTabs: { value: MerchandiseCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    ...CATEGORIES,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Merchandise Catalog"
        description="Caskets, urns, and funeral merchandise"
        action={
          <>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
            <ItemDialog open={addOpen} onOpenChange={setAddOpen} />
          </>
        }
      />

      {/* Category filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              activeCategory === tab.value
                ? 'bg-primary text-primary-foreground font-medium'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Edit dialog */}
      {editItem && (
        <ItemDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(v) => { if (!v) setEditItem(null); }}
        />
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No items in this category.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setEditItem(item)}
            >
              {/* Photo placeholder */}
              <div className="h-36 bg-muted rounded-t-lg flex items-center justify-center">
                <Package className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <CardContent className="pt-3 pb-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm leading-snug">{item.name}</p>
                  <Badge variant="outline" className="text-xs capitalize shrink-0">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-lg font-semibold">{formatPrice(item.retailPrice)}</p>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${item.inStock ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStockMutation.mutate({ id: item.id, inStock: !item.inStock });
                    }}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                      item.inStock ? 'bg-primary' : 'bg-input'
                    }`}
                    role="switch"
                    aria-checked={item.inStock}
                    aria-label={`Toggle stock for ${item.name}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                        item.inStock ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
