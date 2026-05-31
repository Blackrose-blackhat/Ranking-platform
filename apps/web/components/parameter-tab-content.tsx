"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { NumberField } from "@/components/number-field";

interface ParameterField {
  label: string;
  key: string;
}

interface ParameterTabContentProps {
  paramKey: string;
  title: string;
  fields: ParameterField[];
  formData: Record<string, number | null | undefined>;
  onFieldChange: (key: string, value: number) => void;
  onSave: () => void;
  saving: boolean;
}

export function ParameterTabContent({
  paramKey,
  title,
  fields,
  formData,
  onFieldChange,
  onSave,
  saving,
}: ParameterTabContentProps) {
  return (
    <TabsContent value={paramKey}>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                value={formData[field.key]}
                onChange={(v) => onFieldChange(field.key, v)}
              />
            ))}
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? "Saving..." : `Save ${paramKey.toUpperCase()} Data`}
          </button>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
