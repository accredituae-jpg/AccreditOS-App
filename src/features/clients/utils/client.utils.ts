import { ContactPerson } from "../types/client.types";

export function parseContacts(contactPersonStr: string): ContactPerson[] {
  if (!contactPersonStr) return [];
  try {
    const parsed = JSON.parse(contactPersonStr);
    if (Array.isArray(parsed)) {
      return parsed as ContactPerson[];
    }
  } catch {
    // fallback for legacy plain string
  }
  return [{ id: "legacy", name: contactPersonStr, phone: "" }];
}

export function formatContactsList(contactPersonStr: string): string {
  const contacts = parseContacts(contactPersonStr);
  if (contacts.length === 0) return "—";
  return contacts
    .map((c) => c.name + (c.phone ? ` (${c.phone})` : ""))
    .join(", ");
}

export function formatFirstContact(contactPersonStr: string): string {
  const contacts = parseContacts(contactPersonStr);
  if (contacts.length === 0) return "—";
  return contacts[0].name;
}
