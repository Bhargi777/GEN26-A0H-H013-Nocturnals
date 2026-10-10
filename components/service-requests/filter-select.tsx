import { Label, Select } from "@/components/ui";

/** One labelled filter for a plain GET form, so filtering works without JavaScript. */
export function FilterSelect({
  id,
  label,
  value,
  allLabel,
  options,
}: {
  id: string;
  label: string;
  value: string | undefined;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} name={id} defaultValue={value ?? ""}>
        <option value="">{allLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
