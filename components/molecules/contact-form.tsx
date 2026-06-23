"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Contact } from "@/lib/junel/storage/types";
import { randomId } from "@/lib/utils/random-id";

type ContactFormProps = {
  initial?: Contact;
  onSave: (contact: Contact) => void;
  onCancel: () => void;
};

const emptyContact = (): Contact => ({
  id: randomId(),
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
});

export function ContactForm({ initial, onSave, onCancel }: ContactFormProps) {
  const [form, setForm] = useState<Contact>(initial ?? emptyContact());

  function update<K extends keyof Contact>(key: K, value: Contact[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, name: form.name.trim() });
  }

  const fieldClass = "nb-input font-body-md min-h-[56px]";
  const labelClass = "flex flex-col gap-xs font-body-sm text-body-sm text-on-surface-variant";

  return (
    <form onSubmit={handleSubmit} className="p-lg border-b-4 border-black flex flex-col gap-md bg-surface-container-low">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        <label className={labelClass}>
          Name
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Phone
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Company
          <input value={form.company} onChange={(e) => update("company", e.target.value)} className={fieldClass} />
        </label>
      </div>
      <label className={labelClass}>
        Notes
        <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} className={`${fieldClass} resize-y`} />
      </label>
      <div className="flex gap-sm justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Contact</Button>
      </div>
    </form>
  );
}
