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
      
      {type === "BONAFIDE" && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-900">Purpose</label>
            <input
              name="purpose"
              type="text"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
            {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Addressed To (Optional)</label>
            <input
              name="addressedTo"
              type="text"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
          </div>
        </>
      )}

      {type === "NOC" && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-900">Purpose</label>
            <select
              name="purpose"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            >
              <option value="">Select purpose...</option>
              <option value="internship">Internship</option>
              <option value="competition">Competition</option>
              <option value="other">Other</option>
            </select>
            {errors.purpose && <p className="text-red-600 text-sm mt-1">{errors.purpose}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Organisation Name</label>
            <input
              name="organisationName"
              type="text"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
            {errors.organisationName && <p className="text-red-600 text-sm mt-1">{errors.organisationName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Start Date</label>
            <input
              name="startDate"
              type="date"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
            {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">End Date</label>
            <input
              name="endDate"
              type="date"
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
            />
            {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
          </div>
        </>
      )}

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
