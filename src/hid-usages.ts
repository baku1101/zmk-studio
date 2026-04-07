// import { UsagePages } from "./HidUsageTables-1.5.json";
// Filtered with `cat src/HidUsageTables-1.5.json | jq '{ UsagePages: [.UsagePages[] | select([.Id] |inside([7, 12]))] }' > src/keyboard-and-consumer-usage-tables.json`
import { UsagePages } from "./keyboard-and-consumer-usage-tables.json";
import HidOverrides from "./hid-usage-name-overrides.json";

interface HidLabels {
  short?: string;
  med?: string;
  long?: string;
}

const overrides: Record<string, Record<string, HidLabels>> = HidOverrides;

export enum ImplicitMod {
  LeftControl = 0x01,
  LeftShift = 0x02,
  LeftAlt = 0x04,
  LeftGUI = 0x08,
  RightControl = 0x10,
  RightShift = 0x20,
  RightAlt = 0x40,
  RightGUI = 0x80,
}

export const implicit_mod_labels: Record<ImplicitMod, string> = {
  [ImplicitMod.LeftControl]: "L Ctrl",
  [ImplicitMod.LeftShift]: "L Shift",
  [ImplicitMod.LeftAlt]: "L Alt",
  [ImplicitMod.LeftGUI]: "L GUI",
  [ImplicitMod.RightControl]: "R Ctrl",
  [ImplicitMod.RightShift]: "R Shift",
  [ImplicitMod.RightAlt]: "R Alt",
  [ImplicitMod.RightGUI]: "R GUI",
};

export const all_implicit_mods = [
  ImplicitMod.LeftControl,
  ImplicitMod.LeftShift,
  ImplicitMod.LeftAlt,
  ImplicitMod.LeftGUI,
  ImplicitMod.RightControl,
  ImplicitMod.RightShift,
  ImplicitMod.RightAlt,
  ImplicitMod.RightGUI,
];

const shifted_us_keyboard_labels: Record<number, string> = {
  30: "!",
  31: "@",
  32: "#",
  33: "$",
  34: "%",
  35: "^",
  36: "&",
  37: "*",
  38: "(",
  39: ")",
  45: "_",
  46: "+",
  47: "{",
  48: "}",
  49: "|",
  51: ":",
  52: "\"",
  53: "~",
  54: "<",
  55: ">",
  56: "?",
};

export interface UsageId {
  Id: number;
  Name: string;
}

export interface UsagePageInfo {
  Name: string;
  UsageIds: UsageId[];
}

function remove_keyboard_prefix(s?: string) {
  return s?.replace(/^Keyboard /, "");
}

export const hid_usage_from_page_and_id = (page: number, id: number) =>
  (page << 16) + id;

export const mods_to_flags = (mods: number[]) =>
  mods.reduce((sum, value) => sum + value, 0);

export const hid_usage_get_implicit_mod_flags = (usage: number) =>
  (usage >> 24) & 0xff;

export const hid_usage_mask_implicit_mods = (usage: number) =>
  usage & ~(mods_to_flags(all_implicit_mods) << 24);

export const hid_usage_page_and_id_from_usage = (
  usage: number
): [number, number] => [
  (hid_usage_mask_implicit_mods(usage) >> 16) & 0xffff,
  hid_usage_mask_implicit_mods(usage) & 0xffff,
];

export const hid_usage_page_get_ids = (
  usage_page: number
): UsagePageInfo | undefined => UsagePages.find((p) => p.Id === usage_page);

export const hid_usage_get_label = (
  usage_page: number,
  usage_id: number
): string | undefined =>
  overrides[usage_page.toString()]?.[usage_id.toString()]?.short ||
  UsagePages.find((p) => p.Id === usage_page)?.UsageIds?.find(
    (u) => u.Id === usage_id
  )?.Name;

export const hid_usage_get_labels = (
  usage_page: number,
  usage_id: number
): { short?: string; med?: string; long?: string } =>
  overrides[usage_page.toString()]?.[usage_id.toString()] || {
    short: UsagePages.find((p) => p.Id === usage_page)?.UsageIds?.find(
      (u) => u.Id === usage_id
    )?.Name,
  };

export const hid_usage_get_modifier_labels = (usage: number): string[] => {
  const flags = hid_usage_get_implicit_mod_flags(usage);

  return all_implicit_mods
    .filter((modifier) => modifier & flags)
    .map((modifier) => implicit_mod_labels[modifier]);
};

export const hid_usage_get_implicit_mods = (usage: number): number[] => {
  const flags = hid_usage_get_implicit_mod_flags(usage);

  return all_implicit_mods.filter((modifier) => modifier & flags);
};

export interface HidUsageDisplayLabels {
  short?: string;
  med?: string;
  long?: string;
  modifierLabels: string[];
}

export function hid_usage_get_display_labels(
  usage: number,
  { preferShiftedSymbols = false }: { preferShiftedSymbols?: boolean } = {}
): HidUsageDisplayLabels {
  const [page, id] = hid_usage_page_and_id_from_usage(usage);
  const modifierLabels = hid_usage_get_modifier_labels(usage);
  const labels = hid_usage_get_labels(page, id);
  const hasShiftModifier = modifierLabels.some((label) => label.includes("Shift"));
  const shiftedLabel =
    preferShiftedSymbols && hasShiftModifier && page === 7
      ? shifted_us_keyboard_labels[id]
      : undefined;

  return {
    short: shiftedLabel || remove_keyboard_prefix(labels.short),
    med: shiftedLabel || remove_keyboard_prefix(labels.med || labels.short),
    long: shiftedLabel || remove_keyboard_prefix(labels.long || labels.med || labels.short),
    modifierLabels,
  };
}
