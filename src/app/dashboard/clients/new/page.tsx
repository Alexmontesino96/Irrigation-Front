import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <div className="space-y-4">
      <h1>Nuevo cliente</h1>
      <ClientForm />
    </div>
  );
}
