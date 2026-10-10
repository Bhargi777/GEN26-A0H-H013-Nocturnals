"use client";

import React, { useState } from "react";
import { REQUEST_TYPES, RequestType } from "./request-types";
import { submitRequest } from "../../app/(app)/requests/actions";
import { useRouter } from "next/navigation";

export function RequestForm({ type }: { type: RequestType }) {
  const config = REQUEST_TYPES[type];
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = config.fields.safeParse(formData);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(newErrors);
    } else {
      setErrors({});
      setIsSubmitting(true);
      try {
        const resultAction = await submitRequest(type, result.data);
        if (resultAction.success) {
          alert(`Success! Request ${resultAction.code} created.`);
          router.push("/requests");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to submit request.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Simple generation based on schema shape (this is a basic version)
  // In a real app we might inspect the Zod object more deeply,
  // but for now we'll handle the known fields for BONAFIDE and NOC
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">{config.label}</h2>
      <p className="text-slate-600">{config.description}</p>
      
      {/* Dynamic Fields */}
      {config.uiFields && config.uiFields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-slate-900">{field.label}</label>
          
          {field.type === "select" ? (
            <select
              name={field.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            >
              <option value="">Select...</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <input
              name={field.name}
              type={field.type}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
          )}
          
          {errors[field.name] && <p className="text-red-600 text-sm mt-1">{errors[field.name]}</p>}
        </div>
      ))}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex justify-center rounded-md border border-transparent bg-teal-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
    </form>
  );
}
