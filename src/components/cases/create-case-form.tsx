'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ServiceType } from '@/types';
import { createCase } from '@/lib/api/cases';

const createCaseSchema = z.object({
  deceasedFirstName: z.string().min(1, 'First name is required'),
  deceasedLastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().optional(),
  dateOfDeath: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  notes: z.string().optional(),
});

type CreateCaseFormValues = z.infer<typeof createCaseSchema>;

export function CreateCaseForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateCaseFormValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: { serviceType: ServiceType.burial },
  });

  const mutation = useMutation({
    mutationFn: createCase,
    onSuccess: (newCase) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      toast.success('Case created successfully.');
      router.push(`/cases/${newCase.id}`);
    },
    onError: () => {
      toast.error('Failed to create case. Please try again.');
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 max-w-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="deceasedFirstName" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">First Name</FormLabel>
              <FormControl><Input placeholder="First name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="deceasedLastName" render={({ field }) => (
            <FormItem>
              <FormLabel className="font-medium">Last Name</FormLabel>
              <FormControl><Input placeholder="Last name" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="serviceType" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Service Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select service type" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value={ServiceType.burial}>Burial</SelectItem>
                <SelectItem value={ServiceType.cremation}>Cremation</SelectItem>
                <SelectItem value={ServiceType.graveside}>Graveside</SelectItem>
                <SelectItem value={ServiceType.memorial}>Memorial</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="notes" render={({ field }) => (
          <FormItem>
            <FormLabel className="font-medium">Notes</FormLabel>
            <FormControl><Textarea placeholder="Any additional notes..." rows={3} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Create Case'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/cases')}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
