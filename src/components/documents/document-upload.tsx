'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload } from 'lucide-react';
import { DocumentType } from '@/types';
import { getPresignedUploadUrl } from '@/lib/api/documents';
import axios from 'axios';

export function DocumentUpload({ caseId }: { caseId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.other);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { uploadUrl, documentId } = await getPresignedUploadUrl(caseId, file.name, file.type, docType);
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type }, withCredentials: false });
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', caseId] });
      toast.success('Document uploaded.');
      if (inputRef.current) inputRef.current.value = '';
    },
    onError: () => toast.error('Upload failed. Please try again.'),
  });

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          {Object.values(DocumentType).map((t) => (
            <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadMutation.mutate(file);
      }} />
      <Button size="sm" variant="outline" disabled={uploadMutation.isPending} onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
      </Button>
    </div>
  );
}
