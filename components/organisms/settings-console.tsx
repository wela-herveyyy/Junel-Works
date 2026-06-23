"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ContactForm } from "@/components/molecules/contact-form";
import { ContactRow } from "@/components/molecules/contact-row";
import { PersonalityCard } from "@/components/molecules/personality-card";
import { Switch } from "@/components/ui/switch";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { PERSONALITIES } from "@/lib/junel/constants";
import type { Contact, UserProfile } from "@/lib/junel/storage/types";

const fieldClass = "nb-input font-body-md min-h-[56px]";
const labelClass = "flex flex-col gap-xs font-label-bold text-body-sm text-on-surface-variant";

export function SettingsConsole() {
  const { data, ready, persist } = useJunelStore();
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact>();

  const erpEmail = data?.erpnext?.email;
  const profileEmail = data?.profile.email;

  useEffect(() => {
    if (ready && erpEmail && !profileEmail) {
      persist((prev) => ({ ...prev, profile: { ...prev.profile, email: prev.erpnext?.email ?? prev.profile.email } }));
    }
  }, [ready, erpEmail, profileEmail, persist]);

  if (!ready || !data) {
    return <main className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar p-lg text-on-surface-variant">Loading...</main>;
  }

  const { profile, contacts, settings } = data;
  const nameMissing = !profile.displayName.trim();

  function updateProfile(patch: Partial<UserProfile>) {
    persist((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }

  function updateSettings(patch: Partial<typeof settings>) {
    persist((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }

  function saveContact(contact: Contact) {
    persist((prev) => ({
      ...prev,
      contacts: prev.contacts.some((item) => item.id === contact.id)
        ? prev.contacts.map((item) => (item.id === contact.id ? contact : item))
        : [...prev.contacts, contact],
    }));
    setShowContactForm(false);
    setEditingContact(undefined);
  }

  return (
    <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="w-full min-w-0 px-margin-mobile md:px-margin-desktop pt-lg pb-2xl max-w-[60rem] mx-auto flex flex-col gap-lg">
        <div className="w-full min-w-0">
          <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Saved in your browser and included in agent context.
          </p>
        </div>

        {nameMissing ? (
          <div className="flex items-start gap-sm rounded-lg nb-border nb-shadow-sm bg-primary-container p-md text-on-primary-container">
            <Icon name="waving_hand" className="text-2xl shrink-0" />
            <div className="min-w-0">
              <p className="font-headline-md text-headline-md leading-tight">Welcome to Junel!</p>
              <p className="font-body-md text-body-md">Add your name below so Junel knows who it is helping.</p>
            </div>
          </div>
        ) : null}

        <section className="nb-card p-lg flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <Icon name="person" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Profile</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <label className={`${labelClass} sm:col-span-2`}>
              <span>
                Name <span className="text-error">*</span>
              </span>
              <input
                value={profile.displayName}
                onChange={(e) => updateProfile({ displayName: e.target.value })}
                placeholder="e.g. Hervey Geralph"
                aria-invalid={nameMissing}
                className={`${fieldClass} ${nameMissing ? "border-error" : ""}`}
                required
              />
              {nameMissing ? (
                <span className="font-body-sm text-body-sm text-error">Name is required.</span>
              ) : null}
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              <span className="flex items-center gap-xs">
                Email
                <span className="nb-chip px-sm py-0.5 text-mono-label bg-tertiary-container text-on-tertiary-container">
                  <Icon name="link" size={12} />
                  From ERPNext
                </span>
              </span>
              <input
                type="email"
                value={profile.email}
                readOnly
                title="Synced from your ERPNext login"
                className={`${fieldClass} bg-surface-container text-on-surface-variant cursor-not-allowed`}
              />
            </label>
            <label className={labelClass}>
              Job title <span className="font-body-sm text-on-surface-variant/70">(optional)</span>
              <input value={profile.title} onChange={(e) => updateProfile({ title: e.target.value })} placeholder="e.g. Operations Lead" className={fieldClass} />
            </label>
            <label className={labelClass}>
              Company <span className="font-body-sm text-on-surface-variant/70">(optional)</span>
              <input value={profile.company} onChange={(e) => updateProfile({ company: e.target.value })} placeholder="e.g. Livro Systems" className={fieldClass} />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Timezone <span className="font-body-sm text-on-surface-variant/70">(optional)</span>
              <input value={profile.timezone} onChange={(e) => updateProfile({ timezone: e.target.value })} className={fieldClass} />
            </label>
          </div>
          <label className={labelClass}>
            Bio <span className="font-body-sm text-on-surface-variant/70">(optional)</span>
            <textarea value={profile.bio} onChange={(e) => updateProfile({ bio: e.target.value })} rows={3} placeholder="A short note about you and your role." className={`${fieldClass} min-h-[96px] resize-y`} />
          </label>
        </section>

        <section className="nb-card p-lg flex flex-col gap-md">
          <div className="flex items-center gap-sm">
            <Icon name="psychology" className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Preferences</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {PERSONALITIES.map((p) => (
              <PersonalityCard
                key={p.id}
                {...p}
                checked={settings.personality === p.id}
                onSelect={() => updateSettings({ personality: p.id })}
              />
            ))}
          </div>
          <div className="flex items-center justify-between gap-md pt-md border-t-4 border-black">
            <div>
              <p className="font-body-md text-body-md text-on-surface">Proactive mode</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Suggest next steps when helpful.</p>
            </div>
            <Switch checked={settings.proactiveMode} onCheckedChange={(proactiveMode) => updateSettings({ proactiveMode })} />
          </div>
        </section>

        <section className="nb-card flex flex-col min-w-0">
          <div className="flex justify-between items-center p-lg border-b-4 border-black">
            <div className="flex items-center gap-sm">
              <Icon name="contacts" className="text-secondary" />
              <h3 className="font-headline-md text-headline-md text-on-surface">Contacts</h3>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { setEditingContact(undefined); setShowContactForm(true); }}
            >
              <Icon name="add" size={18} />
              Add
            </Button>
          </div>
          {(showContactForm && !editingContact) || editingContact ? (
            <ContactForm
              key={editingContact?.id ?? "new-contact"}
              initial={editingContact}
              onSave={saveContact}
              onCancel={() => { setShowContactForm(false); setEditingContact(undefined); }}
            />
          ) : null}
          {contacts.length ? (
            contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onEdit={() => setEditingContact(contact)}
                onDelete={() => persist((prev) => ({ ...prev, contacts: prev.contacts.filter((item) => item.id !== contact.id) }))}
              />
            ))
          ) : (
            <p className="p-lg font-body-sm text-body-sm text-on-surface-variant">No contacts yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
