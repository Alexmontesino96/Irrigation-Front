"use client";

import { useParams } from "next/navigation";
import { PropertyForm } from "@/components/properties/property-form";

export default function NewPropertyPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-4">
      <h1>Nueva propiedad</h1>
      <PropertyForm clientId={id} />
    </div>
  );
}
