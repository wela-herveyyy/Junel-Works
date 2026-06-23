import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { Contact } from "@/lib/junel/storage/types";

type ContactRowProps = {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
};

export function ContactRow({ contact, onEdit, onDelete }: ContactRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md p-md border-b-4 border-black/10 last:border-0 hover:bg-surface-container-low transition-colors">
      <div className="min-w-0">
        <h4 className="font-body-md text-body-md text-on-surface">{contact.name || "Unnamed contact"}</h4>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          {[contact.email, contact.phone, contact.company].filter(Boolean).join(" · ") || "No details"}
        </p>
        {contact.notes ? (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs leading-relaxed">{contact.notes}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-sm shrink-0">
        <Button type="button" variant="ghost" size="icon" className="h-auto w-auto p-sm" onClick={onEdit}>
          <Icon name="edit" size={18} />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-auto w-auto p-sm hover:text-error" onClick={onDelete}>
          <Icon name="delete" size={18} />
        </Button>
      </div>
    </div>
  );
}
