"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Button } from "./button";
import { FormField } from "./form-field";

export interface FileInputProps {
  label: string;
  onChange: (file: File | null) => void;
  maxBytes?: number;
  disabled?: boolean;
}

export function FileInput({ label, onChange, maxBytes = 5 * 1024 * 1024, disabled }: FileInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!file) { setPreview(undefined); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function clear() {
    setFile(null);
    setError(undefined);
    if (input.current) input.current.value = "";
    onChange(null);
  }

  return (
    <div className="space-y-3">
      <FormField label={label} error={error} help={`One JPEG, PNG, WebP or GIF image, up to ${Math.round(maxBytes / 1024 / 1024)} MB.`}>
        {(control) => <input {...control} ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled} className="control" onChange={(event) => {
          const selected = event.currentTarget.files?.[0];
          if (!selected) { clear(); return; }
          const parsed = z.object({
            type: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"], { errorMap: () => ({ message: "Choose a JPEG, PNG, WebP or GIF image." }) }),
            size: z.number().positive("The image is empty. Choose another image.").max(maxBytes, "The image is too large. Choose a smaller image."),
          }).safeParse(selected);
          if (!parsed.success) {
            clear();
            setError(parsed.error.issues[0].message);
            return;
          }
          setError(undefined);
          setFile(selected);
          onChange(selected);
        }} />}
      </FormField>
      {file && <div className="space-y-2">
        {preview && <img src={preview} alt={`Selected image: ${file.name}`} className="max-h-48 max-w-full rounded-card object-contain" onError={() => { clear(); setError("This image could not be read. Choose another image."); }} />}
        <p className="break-all text-secondary">{file.name}</p>
        <Button variant="secondary" size="sm" onClick={clear} disabled={disabled}>Remove image</Button>
      </div>}
    </div>
  );
}
