'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, Clock, FileText, Upload, User } from 'lucide-react';
import { toast } from 'sonner';
import { publicApiClient } from '@/lib/api/public-client';
import type { PortalData } from './page';

const STAGE_LABELS: Record<string, string> = {
  first_call: 'First Call',
  arrangement_scheduled: 'Arrangement Scheduled',
  arrangement_complete: 'Arrangements Complete',
  in_preparation: 'In Preparation',
  services_scheduled: 'Services Scheduled',
  services_complete: 'Services Complete',
  death_cert_filed: 'Death Certificate Filed',
  closed: 'Closed',
};

const STAGE_ORDER = Object.keys(STAGE_LABELS);

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  new: 'secondary',
  in_progress: 'default',
  completed: 'default',
  archived: 'outline',
};

function StageTimeline({ currentStage }: { currentStage: string }) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={stage} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
                isDone ? 'bg-primary border-primary'
                  : isCurrent ? 'bg-primary/20 border-primary'
                  : 'bg-muted border-muted-foreground/30'
              }`} />
              {i < STAGE_ORDER.length - 1 && (
                <div className={`w-0.5 h-5 ${isDone ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </div>
            <span className={`text-sm pb-4 ${
              isCurrent ? 'font-semibold text-primary'
                : isDone ? 'text-muted-foreground line-through'
                : 'text-muted-foreground'
            }`}>
              {STAGE_LABELS[stage] ?? stage}
              {isCurrent && <span className="ml-2 text-xs font-normal">(current)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DocumentRow({ doc }: { doc: { id: string; fileName: string; documentType: string; uploaded: boolean } }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{doc.fileName}</p>
        <p className="text-xs text-muted-foreground capitalize">{doc.documentType.replace(/_/g, ' ')}</p>
      </div>
      {doc.uploaded
        ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
    </div>
  );
}

interface UploadButtonProps {
  accessToken: string;
  onUploaded: () => void;
}

function UploadButton({ accessToken, onUploaded }: UploadButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { data } = await publicApiClient.post<{ uploadUrl: string; documentId: string }>(
        `/family-portal/${accessToken}/documents`,
        {
          fileName: file.name,
          contentType: file.type || 'application/octet-stream',
          documentType: 'other',
        },
      );

      await fetch(data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });

      toast.success(`${file.name} uploaded successfully`);
      onUploaded();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        {uploading ? 'Uploading…' : 'Upload Document'}
      </Button>
    </>
  );
}

export function FamilyPortalView({
  data,
  accessToken,
}: {
  data: PortalData;
  accessToken: string;
}) {
  const [docs, setDocs] = useState(data.documents);
  const [refreshing, setRefreshing] = useState(false);
  const caseData = data.case!;

  async function refreshDocs() {
    setRefreshing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/family-portal/${accessToken}`);
      if (res.ok) {
        const refreshed = (await res.json()) as PortalData;
        setDocs(refreshed.documents);
      }
    } finally {
      setRefreshing(false);
    }
  }

  const primaryContact = data.contacts.find((c) => c.isPrimaryContact);
  const serviceLabel = caseData.serviceType.charAt(0).toUpperCase() + caseData.serviceType.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b px-4 py-5 sm:px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Arrangement Status</p>
          <h1 className="text-xl font-semibold">{caseData.deceasedName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant={STATUS_VARIANT[caseData.status] ?? 'secondary'} className="capitalize">
              {caseData.status.replace(/_/g, ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">{serviceLabel} Service</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-lg mx-auto px-4 py-6 sm:px-6">
        <Tabs defaultValue="status">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="status" className="flex-1">Status</TabsTrigger>
            <TabsTrigger value="documents" className="flex-1">
              Documents{docs.length > 0 && ` (${docs.length})`}
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex-1">Contacts</TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-5">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Progress</p>
              <StageTimeline currentStage={caseData.stage} />
            </Card>

            <Card className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Case Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Case opened</span>
                  <span>{new Date(caseData.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service type</span>
                  <span className="capitalize">{caseData.serviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current stage</span>
                  <span>{STAGE_LABELS[caseData.stage] ?? caseData.stage}</span>
                </div>
              </div>
            </Card>

            <p className="text-xs text-center text-muted-foreground">
              Questions? Contact your funeral home directly.
            </p>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
              <UploadButton accessToken={accessToken} onUploaded={refreshDocs} />
            </div>

            <Card className="p-4">
              {refreshing ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : docs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No documents yet</p>
                  <p className="text-xs mt-1">Upload certificates, IDs, or other paperwork</p>
                </div>
              ) : (
                docs.map((doc) => <DocumentRow key={doc.id} doc={doc} />)
              )}
            </Card>
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="space-y-3">
            {data.contacts.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground text-sm">No contacts on file</Card>
            ) : (
              data.contacts.map((contact) => (
                <Card key={contact.id} className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{contact.name}</p>
                      {contact.isPrimaryContact && (
                        <Badge variant="secondary" className="text-xs">Primary</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{contact.relationship}</p>
                  </div>
                </Card>
              ))
            )}

            {primaryContact && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                Portal access is linked to {primaryContact.name}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
