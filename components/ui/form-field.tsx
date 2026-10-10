"use client";

import { useId, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`control min-h-11 ${className}`} />;
}
export function Textarea({ className = "", rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} rows={rows} className={`control ${className}`} />;
}
export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`control min-h-11 ${className}`}>{children}</select>;
}
export function Label({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={`block font-medium ${className}`} />;
}
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  return children ? <p id={id} role="alert" className="text-status-red-dark">{children}</p> : null;
}

export interface FieldControlProps {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  required?: boolean;
}

export interface FormFieldProps {
  id?: string;
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: (control: FieldControlProps) => ReactNode;
}

export function FormField({ id, label, help, error, required, children }: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const description = [help ? `${controlId}-help` : "", error ? `${controlId}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className="space-y-2">
      <Label htmlFor={controlId}>{label}{required ? " (required)" : ""}</Label>
      {children({ id: controlId, "aria-describedby": description || undefined, "aria-invalid": error ? true : undefined, required })}
      {help && <p id={`${controlId}-help`} className="text-secondary">{help}</p>}
      <FieldError id={`${controlId}-error`}>{error}</FieldError>
    </div>
  );
}
