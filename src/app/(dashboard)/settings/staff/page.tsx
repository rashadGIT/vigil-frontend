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
import { Plus } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { UserRole } from '@/types';

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: () => apiClient.get('/users').then((r) => r.data),
  });

  const inviteMutation = useMutation({
    mutationFn: () => apiClient.post('/users/invite', { email, name, role: UserRole.staff }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(`Invitation sent to ${email}.`);
      setOpen(false); setEmail(''); setName('');
    },
    onError: () => toast.error('Failed to send invitation.'),
  });

  return (
    <div className="space-y-4 max-w-xl">
      <PageHeader
        title="Staff"
        description="Manage team members and roles."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Invite Staff</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Invite Team Member</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label className="font-medium">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
                </div>
                <div className="space-y-1">
                  <Label className="font-medium">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
                </div>
                <Button className="w-full" disabled={!email || !name || inviteMutation.isPending} onClick={() => inviteMutation.mutate()}>
                  {inviteMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (
        <div className="rounded-md border divide-y">
          {staff.map((member: { id: string; name: string; email: string; role: UserRole }) => (
            <div key={member.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
              <Badge variant="outline" className="text-xs">{member.role}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
