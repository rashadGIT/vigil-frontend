'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/api/client';

const brandingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  googleReviewUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingSettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.get('/settings').then((r) => r.data),
  });

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { name: '', googleReviewUrl: '' },
  });

  useEffect(() => {
    if (settings) {
      form.reset({ name: settings.name ?? '', googleReviewUrl: settings.googleReviewUrl ?? '' });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: (values: BrandingFormValues) => apiClient.patch('/settings', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved.'); },
    onError: () => toast.error('Failed to save settings.'),
  });

  return (
    <div className="space-y-6 max-w-lg">
      <PageHeader title="Branding" description="Funeral home name and review link." />
      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Funeral Home Name</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Separator />
          <FormField control={form.control} name="googleReviewUrl" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Google Review URL</FormLabel>
              <FormControl><Input placeholder="https://g.page/..." {...field} /></FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">Used for automated review requests 14 days after service completion.</p>
            </FormItem>
          )} />
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
