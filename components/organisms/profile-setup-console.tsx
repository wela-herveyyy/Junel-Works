"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { suggestDisplayName } from "@/lib/junel/profile";
import type { JunelStorage } from "@/lib/junel/storage/types";

type ProfileSetupConsoleProps = {
  data: JunelStorage;
  onSave: (displayName: string, title: string) => void;
};

const fieldClass = "nb-input font-body-md min-h-[56px]";

export function ProfileSetupConsole({ data, onSave }: ProfileSetupConsoleProps) {
  const suggested = suggestDisplayName(data.erpnext?.user, data.erpnext?.email || data.profile.email);
  const [displayName, setDisplayName] = useState(data.profile.displayName.trim() || suggested);
  const [title, setTitle] = useState(data.profile.title);
  const [error, setError] = useState<string>();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("Please enter your name to continue.");
      return;
    }
    setError(undefined);
    onSave(name, title.trim());
  }

  return (
    <main className="flex flex-1 min-h-0 items-center justify-center chat-bg px-md py-lg overflow-y-auto custom-scrollbar">
      <div className="w-full min-w-0 max-w-112 nb-card p-lg nb-shadow-md chat-hero-enter">
        <div className="text-center mb-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-container nb-border nb-shadow-sm mb-sm">
            <Icon name="waving_hand" className="text-on-primary-container text-3xl" />
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-xs">What should Junel call you?</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Your name is saved in this browser and sent to the agent on every chat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs font-label-bold text-body-sm text-on-surface-variant">
            Name <span className="text-error">*</span>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Hervey Geralph"
              className={fieldClass}
              autoFocus
              required
            />
          </label>

          <label className="flex flex-col gap-xs font-label-bold text-body-sm text-on-surface-variant">
            Job title <span className="font-body-sm text-on-surface-variant/70 font-normal">(optional)</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Web Developer"
              className={fieldClass}
            />
          </label>

          {data.erpnext?.email || data.profile.email ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Signed in as{" "}
              <span className="text-secondary font-bold break-all">{data.erpnext?.email || data.profile.email}</span>
            </p>
          ) : null}

          {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}

          <Button type="submit" className="w-full">
            Continue to Junel
          </Button>
        </form>
      </div>
    </main>
  );
}
