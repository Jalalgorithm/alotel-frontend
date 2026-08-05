import { useRef, useState } from 'react';
import { FileCheck2, Upload, X } from 'lucide-react';
import { cn } from '@/utils/classNames';
import { Button } from './Button';

const DEFAULT_ACCEPT = 'image/jpeg,image/png,application/pdf';

/**
 * Drag-and-drop file picker used by the identity-verification and
 * payment-receipt steps.
 *
 * @param {{
 *   onFileSelected?: (file: File | null) => void,
 *   accept?: string,
 *   maxSizeMb?: number,
 *   hint?: string,
 *   fileName?: string,
 * }} props
 */
export const FileDropzone = ({
  onFileSelected,
  accept = DEFAULT_ACCEPT,
  maxSizeMb = 20,
  hint = 'JPEG, PNG, PDF, and format, up to 20MB',
  fileName,
  className,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedName, setSelectedName] = useState(fileName ?? '');
  const [error, setError] = useState('');

  const acceptFile = (file) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`File is larger than ${maxSizeMb}MB. Please upload a smaller file.`);
      return;
    }

    setError('');
    setSelectedName(file.name);
    onFileSelected?.(file);
  };

  const clear = () => {
    setSelectedName('');
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onFileSelected?.(null);
  };

  return (
    <div className={className}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          acceptFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          isDragging ? 'border-brand-600 bg-brand-50' : 'border-line bg-white',
          error && 'border-danger',
        )}
      >
        {selectedName ? (
          <>
            <FileCheck2 className="size-7 text-brand-600" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink">{selectedName}</p>
            <button
              type="button"
              onClick={clear}
              className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted transition-colors hover:text-danger"
            >
              <X className="size-3" /> Remove file
            </button>
          </>
        ) : (
          <>
            <Upload className="size-6 text-ink-muted" aria-hidden="true" />
            <p className="mt-3 font-display text-lg font-semibold text-ink">Choose a file or drag &amp; drop</p>
            <p className="mt-1 text-[13px] text-ink-muted">{hint}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => inputRef.current?.click()}
            >
              Browse File
            </Button>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => acceptFile(event.target.files?.[0])}
        />
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
};
