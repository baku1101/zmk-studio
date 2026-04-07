import type { ReactNode } from "react";

import type {
  BehaviorBindingParametersSet,
  GetBehaviorDetailsResponse,
  BehaviorParameterValueDescription,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import type { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";

import { validateValue } from "../behaviors/parameters";
import { hid_usage_get_display_labels } from "../hid-usages";
import { HidUsageLabel } from "./HidUsageLabel";

interface LayerOption {
  id: number;
  name: string;
}

export interface KeyDisplay {
  header?: string;
  primary: ReactNode;
  primaryText?: string;
  footer?: ReactNode;
  title?: string;
}

function renderTextNode(text?: string) {
  return text ? (
    <span className="block max-w-full whitespace-nowrap text-[0.72rem] font-medium leading-none">
      {text}
    </span>
  ) : undefined;
}

function getMatchingMetadataSet(
  metadata: BehaviorBindingParametersSet[] | undefined,
  binding: BehaviorBinding,
  layers: LayerOption[]
) {
  if (!metadata) {
    return undefined;
  }

  const layerIds = layers.map(({ id }) => id);

  return (
    metadata.find((set) =>
      validateValue(layerIds, binding.param1, set.param1) &&
      validateValue(layerIds, binding.param2, set.param2)
    ) ||
    metadata.find((set) => validateValue(layerIds, binding.param1, set.param1)) ||
    metadata[0]
  );
}

function getBehaviorName(behavior?: GetBehaviorDetailsResponse) {
  return behavior?.displayName || "Unknown";
}

function getLayerName(layerId: number, layers: LayerOption[]) {
  return layers.find((layer) => layer.id === layerId)?.name || `Layer ${layerId}`;
}

function getParameterKind(values?: BehaviorParameterValueDescription[]) {
  if (!values || values.length === 0) {
    return "none";
  }

  if (values.every((value) => value.constant !== undefined)) {
    return "constant";
  }

  if (values.length === 1 && values[0].hidUsage) {
    return "hidUsage";
  }

  if (values.length === 1 && values[0].layerId) {
    return "layerId";
  }

  if (values.length === 1 && values[0].range) {
    return "range";
  }

  return "mixed";
}

function getParameterText(
  value: number,
  kind: string,
  values: BehaviorParameterValueDescription[] | undefined,
  layers: LayerOption[]
) {
  if (kind === "hidUsage") {
    return hid_usage_get_display_labels(value, { preferShiftedSymbols: true }).short;
  }

  if (kind === "layerId") {
    return getLayerName(value, layers);
  }

  if (kind === "constant") {
    return values?.find((entry) => entry.constant === value)?.name || value.toLocaleString();
  }

  if (kind === "range") {
    return value.toLocaleString();
  }

  return undefined;
}

function getParameterNode(
  value: number,
  kind: string,
  values: BehaviorParameterValueDescription[] | undefined,
  layers: LayerOption[]
) {
  if (kind === "hidUsage") {
    return <HidUsageLabel hid_usage={value} preferShiftedSymbols={true} variant="short" />;
  }

  const text = getParameterText(value, kind, values, layers);
  return renderTextNode(text);
}

function getKeyPressDisplay(binding: BehaviorBinding, behaviorName: string): KeyDisplay {
  const labels = hid_usage_get_display_labels(binding.param1, { preferShiftedSymbols: true });

  return {
    header: behaviorName,
    primary: <HidUsageLabel hid_usage={binding.param1} preferShiftedSymbols={true} variant="short" />,
    primaryText: labels.short || labels.med || labels.long,
    footer: labels.modifierLabels.length > 0 ? labels.modifierLabels.join("+") : undefined,
    title:
      labels.modifierLabels.length > 0
        ? `${labels.modifierLabels.join("+")}+${labels.long || labels.med || labels.short || ""}`
        : labels.long || labels.med || labels.short,
  };
}

function getLayerTapDisplay(
  binding: BehaviorBinding,
  behaviorName: string,
  metadataSet: BehaviorBindingParametersSet | undefined,
  layers: LayerOption[]
): KeyDisplay {
  const tapKind = getParameterKind(metadataSet?.param2);
  const tapText = getParameterText(binding.param2, tapKind, metadataSet?.param2, layers);
  const layerName = getLayerName(binding.param1, layers);

  return {
    header: behaviorName,
    primary: getParameterNode(binding.param2, tapKind, metadataSet?.param2, layers) || renderTextNode(tapText),
    primaryText: tapText,
    footer: layerName,
    title: `Tap ${tapText || "key"}, hold ${layerName}`,
  };
}

function getModTapDisplay(
  binding: BehaviorBinding,
  behaviorName: string,
  metadataSet: BehaviorBindingParametersSet | undefined,
  layers: LayerOption[]
): KeyDisplay {
  const tapKind = getParameterKind(metadataSet?.param2);
  const holdKind = getParameterKind(metadataSet?.param1);
  const tapText = getParameterText(binding.param2, tapKind, metadataSet?.param2, layers);
  const holdText = getParameterText(binding.param1, holdKind, metadataSet?.param1, layers);

  return {
    header: behaviorName,
    primary: getParameterNode(binding.param2, tapKind, metadataSet?.param2, layers) || renderTextNode(tapText),
    primaryText: tapText,
    footer: holdText,
    title: `Tap ${tapText || "key"}, hold ${holdText || "modifier"}`,
  };
}

export function getKeyDisplay(
  binding: BehaviorBinding,
  behavior: GetBehaviorDetailsResponse | undefined,
  layers: LayerOption[]
): KeyDisplay {
  const behaviorName = getBehaviorName(behavior);
  const normalizedName = behaviorName.toLowerCase();
  const metadataSet = getMatchingMetadataSet(behavior?.metadata, binding, layers);
  const param1Kind = getParameterKind(metadataSet?.param1);
  const param2Kind = getParameterKind(metadataSet?.param2);

  if (normalizedName === "key press") {
    return getKeyPressDisplay(binding, behaviorName);
  }

  if (normalizedName.includes("layer") && normalizedName.includes("tap")) {
    return getLayerTapDisplay(binding, behaviorName, metadataSet, layers);
  }

  if (normalizedName.includes("mod") && normalizedName.includes("tap")) {
    return getModTapDisplay(binding, behaviorName, metadataSet, layers);
  }

  if (param1Kind === "layerId" && binding.param1 !== undefined) {
    const layerName = getLayerName(binding.param1, layers);

    return {
      header: behaviorName,
      primary: renderTextNode(layerName),
      primaryText: layerName,
      title: `${behaviorName}: ${layerName}`,
    };
  }

  if (param1Kind === "hidUsage" && binding.param1 !== undefined) {
    const labels = hid_usage_get_display_labels(binding.param1, { preferShiftedSymbols: true });

    return {
      header: behaviorName,
      primary: <HidUsageLabel hid_usage={binding.param1} preferShiftedSymbols={true} variant="short" />,
      primaryText: labels.short || labels.med || labels.long,
      footer: labels.modifierLabels.length > 0 ? labels.modifierLabels.join("+") : undefined,
      title: `${behaviorName}: ${labels.long || labels.med || labels.short || ""}`,
    };
  }

  if (param2Kind !== "none" && binding.param2 !== undefined) {
    const primary = getParameterNode(binding.param1, param1Kind, metadataSet?.param1, layers);
    const footer = getParameterText(binding.param2, param2Kind, metadataSet?.param2, layers);

    return {
      header: behaviorName,
      primary: primary || renderTextNode(getParameterText(binding.param1, param1Kind, metadataSet?.param1, layers)),
      primaryText: getParameterText(binding.param1, param1Kind, metadataSet?.param1, layers),
      footer,
      title: footer ? `${behaviorName}: ${footer}` : behaviorName,
    };
  }

  return {
    header: behaviorName,
    primary: renderTextNode(""),
    primaryText: "",
    title: behaviorName,
  };
}
