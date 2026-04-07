import type {
  BehaviorBindingParametersSet,
  BehaviorParameterValueDescription,
  GetBehaviorDetailsResponse,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import type { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";

import { hid_usage_get_display_labels } from "../hid-usages";
import { validateValue } from "./parameters";

interface LayerOption {
  id: number;
  name: string;
}

interface BehaviorHelpDetails {
  description: string;
  param1Label?: string;
  param2Label?: string;
  docsUrl?: string;
}

const behaviorHelpByName: Record<string, BehaviorHelpDetails> = {
  "key press": {
    description: "Sends standard keycodes to the connected host when the key is pressed.",
    param1Label: "Key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/key-press",
  },
  "layer tap": {
    description: "Enables a layer when held, and sends a key press when tapped briefly.",
    param1Label: "Hold layer",
    param2Label: "Tap key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "layer-tap": {
    description: "Enables a layer when held, and sends a key press when tapped briefly.",
    param1Label: "Hold layer",
    param2Label: "Tap key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "mod tap": {
    description: "Sends a different key press depending on whether the key is held or tapped.",
    param1Label: "Hold modifier",
    param2Label: "Tap key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "mod-tap": {
    description: "Sends a different key press depending on whether the key is held or tapped.",
    param1Label: "Hold modifier",
    param2Label: "Tap key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "momentary layer": {
    description: "Enables a layer while the key is pressed, and disables it again on release.",
    param1Label: "Layer",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/layers",
  },
  "toggle layer": {
    description: "Enables a layer if it is disabled, or disables it if it is already enabled.",
    param1Label: "Layer",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/layers",
  },
  "sticky layer": {
    description: "Activates a layer until another key is pressed, then deactivates it.",
    param1Label: "Layer",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/sticky-layer",
  },
  bluetooth: {
    description: "Completes a Bluetooth action on press, for example switching profiles or disconnecting.",
    param1Label: "Action",
    param2Label: "Profile",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/bluetooth",
  },
  "output selection": {
    description: "Selects whether keyboard output is sent to USB or Bluetooth when both are connected.",
    param1Label: "Output",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/outputs",
  },
  "sticky key": {
    description: "Stays pressed until another key is pressed, then is released.",
    param1Label: "Modifier",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/sticky-key",
  },
  transparent: {
    description: "Passes the key press down to the next active layer in the stack for processing.",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  none: {
    description: "Swallows the key press so nothing is sent and the press is not passed to lower layers.",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "studio unlock": {
    description: "Unlocks the device so the ZMK Studio UI can make changes.",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "mouse key press": {
    description: "Sends a mouse-related input such as cursor movement or a click.",
    param1Label: "Mouse action",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse button press": {
    description: "Emulates pressing mouse buttons.",
    param1Label: "Button",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse move": {
    description: "Emulates mouse movement.",
    param1Label: "Movement",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse scroll": {
    description: "Emulates mouse scrolling.",
    param1Label: "Scroll",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "key toggle": {
    description: "Toggles a key between pressed and released states.",
    param1Label: "Key",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "key repeat": {
    description: "Repeats the most recent key press.",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  bootloader: {
    description: "Resets the keyboard and puts it into bootloader mode so new firmware can be flashed.",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "to layer": {
    description: "Enables a layer and disables all other layers except the default layer.",
    param1Label: "Layer",
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/layers",
  },
};

function normalizeBehaviorName(name: string | undefined) {
  return (name || "").trim().toLowerCase();
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

function describeValueType(values?: BehaviorParameterValueDescription[]) {
  if (!values || values.length === 0) {
    return undefined;
  }

  if (values.length === 1 && values[0].hidUsage) {
    return "key";
  }

  if (values.length === 1 && values[0].layerId) {
    return "layer";
  }

  if (values.length === 1 && values[0].range) {
    return "number";
  }

  if (values.every((value) => value.constant !== undefined)) {
    return "option";
  }

  return "setting";
}

function buildGenericDescription(
  behavior: GetBehaviorDetailsResponse,
  metadataSet?: BehaviorBindingParametersSet
) {
  const name = behavior.displayName;
  const normalizedName = normalizeBehaviorName(name);
  const param1Type = describeValueType(metadataSet?.param1);
  const param2Type = describeValueType(metadataSet?.param2);

  if (normalizedName.includes("tap") && normalizedName.includes("dance")) {
    return "Invokes different behaviors depending on how many times the key is pressed.";
  }

  if (normalizedName.includes("macro")) {
    return "Allows configuring a list of other behaviors to invoke when the key is pressed and or released.";
  }

  if (normalizedName.includes("morph")) {
    return "Invokes different behaviors depending on whether a specified modifier is held during a key press.";
  }

  if (normalizedName.includes("sensor") || normalizedName.includes("rotate")) {
    return "Invokes different behaviors depending on whether a sensor is rotated clockwise or counter-clockwise.";
  }

  if (normalizedName.includes("layer")) {
    return "Controls layer state for the keyboard.";
  }

  if (normalizedName.includes("toggle")) {
    return "Toggles a setting or input state on each press.";
  }

  if (param1Type && param2Type) {
    return `This behavior uses two settings: a ${param1Type} and a ${param2Type}.`;
  }

  if (param1Type) {
    return `This behavior uses one ${param1Type} setting.`;
  }

  return `${name} is configurable from the parameters below.`;
}

function getDocsUrl(behaviorName: string) {
  const normalizedName = normalizeBehaviorName(behaviorName);
  const mapped = behaviorHelpByName[normalizedName]?.docsUrl;

  if (mapped) {
    return mapped;
  }

  if (normalizedName.includes("mod") && normalizedName.includes("tap")) {
    return "https://zmk.dev/docs/keymaps/behaviors/mod-tap";
  }

  if (normalizedName.includes("layer") && normalizedName.includes("tap")) {
    return "https://zmk.dev/docs/keymaps/behaviors/mod-tap";
  }

  if (normalizedName.includes("layer")) {
    return "https://zmk.dev/docs/keymaps/behaviors/layers";
  }

  if (normalizedName.includes("mouse") || normalizedName.includes("scroll")) {
    return "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation";
  }

  if (normalizedName.includes("bluetooth")) {
    return "https://zmk.dev/docs/keymaps/behaviors/bluetooth";
  }

  return "https://zmk.dev/docs/keymaps/behaviors";
}

function getParameterLabelFromType(
  parameterIndex: 1 | 2,
  values?: BehaviorParameterValueDescription[]
) {
  const valueType = describeValueType(values);

  if (valueType === "key") {
    return "Key";
  }

  if (valueType === "layer") {
    return "Layer";
  }

  if (valueType === "number") {
    return "Value";
  }

  if (valueType === "option") {
    return parameterIndex === 1 ? "Option" : "Detail";
  }

  return parameterIndex === 1 ? "Param 1" : "Param 2";
}

function getParameterLabel(
  behaviorName: string,
  parameterIndex: 1 | 2,
  values?: BehaviorParameterValueDescription[]
) {
  const help = behaviorHelpByName[normalizeBehaviorName(behaviorName)];
  const overrideLabel = parameterIndex === 1 ? help?.param1Label : help?.param2Label;

  if (overrideLabel) {
    return overrideLabel;
  }

  if (!values || values.length === 0) {
    return undefined;
  }

  if (values.length === 1 && values[0].name) {
    return values[0].name;
  }

  return getParameterLabelFromType(parameterIndex, values);
}

function getLayerName(layerId: number, layers: LayerOption[]) {
  return layers.find((layer) => layer.id === layerId)?.name || `Layer ${layerId}`;
}

function describeParameterValue(
  value: number | undefined,
  values: BehaviorParameterValueDescription[] | undefined,
  layers: LayerOption[]
) {
  if (value === undefined) {
    return undefined;
  }

  if (!values || values.length === 0) {
    return value.toLocaleString();
  }

  const constantValue = values.find((entry) => entry.constant === value);
  if (constantValue?.name) {
    return constantValue.name;
  }

  if (values.length === 1 && values[0].hidUsage) {
    const labels = hid_usage_get_display_labels(value, { preferShiftedSymbols: true });
    const keyLabel = labels.long || labels.med || labels.short;

    return labels.modifierLabels.length > 0
      ? `${labels.modifierLabels.join("+")}+${keyLabel}`
      : keyLabel;
  }

  if (values.length === 1 && values[0].layerId) {
    return getLayerName(value, layers);
  }

  if (values.length === 1 && values[0].range) {
    return value.toLocaleString();
  }

  if (values.some((entry) => entry.nil) && value === 0) {
    return "None";
  }

  return value.toLocaleString();
}

export interface BehaviorHelpProps {
  behavior?: GetBehaviorDetailsResponse;
  binding: BehaviorBinding;
  layers: LayerOption[];
}

export const BehaviorHelp = ({
  behavior,
  binding,
  layers,
}: BehaviorHelpProps) => {
  if (!behavior) {
    return null;
  }

  const help = behaviorHelpByName[normalizeBehaviorName(behavior.displayName)];
  const metadataSet = getMatchingMetadataSet(behavior.metadata, binding, layers);
  const description = help?.description || buildGenericDescription(behavior, metadataSet);
  const docsUrl = getDocsUrl(behavior.displayName);
  const param1Label = getParameterLabel(behavior.displayName, 1, metadataSet?.param1);
  const param2Label = getParameterLabel(behavior.displayName, 2, metadataSet?.param2);
  const param1Value = describeParameterValue(binding.param1, metadataSet?.param1, layers);
  const param2Value = describeParameterValue(binding.param2, metadataSet?.param2, layers);

  return (
    <div className="rounded border border-base-300 bg-base-100 p-3 text-sm">
      <div className="font-medium">{behavior.displayName}</div>
      <p className="mt-1 text-base-content/70">{description}</p>
      <a
        className="mt-2 inline-block text-xs text-primary underline underline-offset-2"
        href={docsUrl}
        target="_blank"
        rel="noreferrer"
      >
        Open ZMK docs
      </a>
      {(param1Label || param2Label) && (
        <div className="mt-3 grid gap-1.5">
          {param1Label && (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <div className="text-base-content/60">{param1Label}</div>
              <div>{param1Value || "None"}</div>
            </div>
          )}
          {param2Label && (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <div className="text-base-content/60">{param2Label}</div>
              <div>{param2Value || "None"}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
