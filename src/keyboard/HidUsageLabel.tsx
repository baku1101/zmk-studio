import { hid_usage_get_display_labels } from "../hid-usages";

export interface HidUsageLabelProps {
  hid_usage: number;
  preferShiftedSymbols?: boolean;
  showModifiers?: boolean;
  variant?: "short" | "med" | "long";
}

export const HidUsageLabel = ({
  hid_usage,
  preferShiftedSymbols = false,
  showModifiers = false,
  variant = "med",
}: HidUsageLabelProps) => {
  const labels = hid_usage_get_display_labels(hid_usage, { preferShiftedSymbols });
  const label =
    variant === "long"
      ? labels.long || labels.med || labels.short
      : variant === "med"
        ? labels.med || labels.short
        : labels.short;

  return (
    <span className="inline-flex max-w-full flex-col items-center justify-center leading-none">
      <span className="block max-w-full whitespace-nowrap">{label}</span>
      {showModifiers && labels.modifierLabels.length > 0 && (
        <span className="mt-0.5 text-[0.6em] opacity-70">
          {labels.modifierLabels.join("+")}
        </span>
      )}
    </span>
  );
};
