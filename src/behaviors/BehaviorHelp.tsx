import { useMemo } from "react";
import type {
  BehaviorBindingParametersSet,
  BehaviorParameterValueDescription,
  GetBehaviorDetailsResponse,
} from "@zmkfirmware/zmk-studio-ts-client/behaviors";
import type { BehaviorBinding } from "@zmkfirmware/zmk-studio-ts-client/keymap";

import { hid_usage_get_display_labels } from "../hid-usages";
import { useLocalStorageState } from "../misc/useLocalStorageState";
import { validateValue } from "./parameters";

interface LayerOption {
  id: number;
  name: string;
}

type HelpLanguage = "en" | "ja";

interface LocalizedText {
  en: string;
  ja: string;
}

interface BehaviorHelpDetails {
  description: LocalizedText;
  param1Label?: LocalizedText;
  param2Label?: LocalizedText;
  docsUrl?: string;
}

const text = (en: string, ja: string): LocalizedText => ({ en, ja });

const behaviorHelpByName: Record<string, BehaviorHelpDetails> = {
  "key press": {
    description: text(
      "Sends standard keycodes to the connected host when the key is pressed.",
      "キーを押したときに、通常のキーコードをホストへ送信します。"
    ),
    param1Label: text("Key", "キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/key-press",
  },
  "grave/escape": {
    description: text(
      "A mod-morph convenience behavior that sends Escape normally, and Grave when Shift or GUI is held.",
      "通常は Escape を送り、Shift または GUI が押されているときは Grave を送る mod-morph 系の convenience behavior です。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-morph",
  },
  "layer tap": {
    description: text(
      "Enables a layer when held, and sends a key press when tapped briefly.",
      "長押し中はレイヤーを有効にし、短くタップするとキー入力を送信します。"
    ),
    param1Label: text("Hold layer", "長押し時レイヤー"),
    param2Label: text("Tap key", "タップ時キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "layer-tap": {
    description: text(
      "Enables a layer when held, and sends a key press when tapped briefly.",
      "長押し中はレイヤーを有効にし、短くタップするとキー入力を送信します。"
    ),
    param1Label: text("Hold layer", "長押し時レイヤー"),
    param2Label: text("Tap key", "タップ時キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "mod tap": {
    description: text(
      "Sends a different key press depending on whether the key is held or tapped.",
      "タップ時と長押し時で異なる入力を送ります。長押し側は修飾キーです。"
    ),
    param1Label: text("Hold modifier", "長押し時修飾キー"),
    param2Label: text("Tap key", "タップ時キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "mod-tap": {
    description: text(
      "Sends a different key press depending on whether the key is held or tapped.",
      "タップ時と長押し時で異なる入力を送ります。長押し側は修飾キーです。"
    ),
    param1Label: text("Hold modifier", "長押し時修飾キー"),
    param2Label: text("Tap key", "タップ時キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mod-tap",
  },
  "momentary layer": {
    description: text(
      "Enables a layer while the key is pressed, and disables it again on release.",
      "押している間だけレイヤーを有効にし、離すと元に戻します。"
    ),
    param1Label: text("Layer", "レイヤー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/layers",
  },
  "toggle layer": {
    description: text(
      "Enables a layer until the layer is manually disabled.",
      "対象レイヤーを有効にし、手動で無効化するまで維持します。"
    ),
    param1Label: text("Layer", "レイヤー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/layers",
  },
  "sticky layer": {
    description: text(
      "Activates a layer until another key is pressed, then deactivates it.",
      "次のキー入力までレイヤーを有効にし、その後自動で解除します。"
    ),
    param1Label: text("Layer", "レイヤー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/sticky-layer",
  },
  "sticky key": {
    description: text(
      "Stays pressed until another key is pressed, then is released.",
      "次のキーが押されるまで押下状態を維持し、その後に解除されます。"
    ),
    param1Label: text("Modifier", "修飾キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/sticky-key",
  },
  bluetooth: {
    description: text(
      "Completes a Bluetooth action on press, for example switching profiles or disconnecting.",
      "Bluetooth の操作を実行します。たとえばプロファイル切替や切断です。"
    ),
    param1Label: text("Action", "操作"),
    param2Label: text("Profile", "プロファイル"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/bluetooth",
  },
  "output selection": {
    description: text(
      "Selects whether keyboard output is sent to USB or Bluetooth when both are connected.",
      "USB と Bluetooth の両方が接続されているときに、どちらへ出力するかを選びます。"
    ),
    param1Label: text("Output", "出力先"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/outputs",
  },
  transparent: {
    description: text(
      "Passes the key press down to the next active layer in the stack for processing.",
      "このレイヤーでは処理せず、下位の有効レイヤーへ入力を渡します。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  none: {
    description: text(
      "Swallows the key press so nothing is sent and the press is not passed to lower layers.",
      "キー入力を消費し、何も送信せず下位レイヤーにも渡しません。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "studio unlock": {
    description: text(
      "Unlocks the device so the ZMK Studio UI can make changes.",
      "ZMK Studio から設定変更できるようにデバイスをアンロックします。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "mouse key press": {
    description: text(
      "Sends a mouse-related input such as cursor movement or a click.",
      "カーソル移動やクリックなど、マウス関連の入力を送信します。"
    ),
    param1Label: text("Mouse action", "マウス操作"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse button press": {
    description: text(
      "Emulates pressing mouse buttons.",
      "マウスボタンの押下をエミュレートします。"
    ),
    param1Label: text("Button", "ボタン"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse move": {
    description: text("Emulates mouse movement.", "マウス移動をエミュレートします。"),
    param1Label: text("Movement", "移動量"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "mouse scroll": {
    description: text("Emulates mouse scrolling.", "マウススクロールをエミュレートします。"),
    param1Label: text("Scroll", "スクロール"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/mouse-emulation",
  },
  "key toggle": {
    description: text(
      "Toggles the press of a key. If the key is not currently pressed, key toggle will press it, holding it until the key toggle is pressed again or the key is released in some other way. If the key is currently pressed, key toggle will release it.",
      "キーの押下状態を切り替えます。未押下なら押しっぱなしにし、再度実行するか別の方法で解除されるまで維持します。すでに押下中なら解除します。"
    ),
    param1Label: text("Key", "キー"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "key repeat": {
    description: text("Repeats the most recent key press.", "直前のキー入力を繰り返します。"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  enc_key_press: {
    description: text(
      "Used for encoders to trigger one key press on clockwise rotation and another on counter-clockwise rotation.",
      "エンコーダー用の behavior で、時計回りと反時計回りで別々のキー入力を送ります。"
    ),
    param1Label: text("Clockwise key", "時計回りキー"),
    param2Label: text("Counter-clockwise key", "反時計回りキー"),
    docsUrl: "https://zmk.dev/docs/development/hardware-integration/encoders",
  },
  reset: {
    description: text(
      "Resets the keyboard and re-runs the firmware flashed to the device.",
      "キーボードをリセットして、書き込まれているファームウェアを再実行します。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "soft off": {
    description: text("Turns the keyboard off.", "キーボードの電源をオフにします。"),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "external power": {
    description: text(
      "Allows enabling or disabling the VCC power output to save power.",
      "消費電力を抑えるために VCC 電源出力を有効または無効にします。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "caps word": {
    description: text(
      "Activates a mode that capitalizes a word while you keep typing compatible keys.",
      "対応するキーを入力している間、単語単位で大文字入力を維持するモードを有効にします。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors/caps-word",
  },
  bootloader: {
    description: text(
      "Resets the keyboard and puts it into bootloader mode so new firmware can be flashed.",
      "キーボードを再起動し、新しいファームウェアを書き込める bootloader モードに入れます。"
    ),
    docsUrl: "https://zmk.dev/docs/keymaps/behaviors",
  },
  "to layer": {
    description: text(
      "Enables a layer and disables all other layers except the default layer.",
      "指定レイヤーを有効にし、デフォルトレイヤー以外の他レイヤーは無効化します。"
    ),
    param1Label: text("Layer", "レイヤー"),
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
  metadataSet: BehaviorBindingParametersSet | undefined,
  language: HelpLanguage
) {
  const name = behavior.displayName;
  const normalizedName = normalizeBehaviorName(name);
  const param1Type = describeValueType(metadataSet?.param1);
  const param2Type = describeValueType(metadataSet?.param2);

  if (normalizedName.includes("tap") && normalizedName.includes("dance")) {
    return language === "ja"
      ? "キーを押した回数に応じて異なる behavior を呼び出します。"
      : "Invokes different behaviors depending on how many times the key is pressed.";
  }
  if (normalizedName.includes("macro")) {
    return language === "ja"
      ? "キーの押下時や離した時に、別の behavior の並びを実行できます。"
      : "Allows configuring a list of other behaviors to invoke when the key is pressed and or released.";
  }
  if (normalizedName.includes("morph")) {
    return language === "ja"
      ? "指定した修飾キーが押されているかどうかで behavior を切り替えます。"
      : "Invokes different behaviors depending on whether a specified modifier is held during a key press.";
  }
  if (normalizedName.includes("sensor") || normalizedName.includes("rotate")) {
    return language === "ja"
      ? "センサーやロータリーの回転方向に応じて異なる behavior を呼び出します。"
      : "Invokes different behaviors depending on whether a sensor is rotated clockwise or counter-clockwise.";
  }
  if (normalizedName.includes("bluetooth")) {
    return language === "ja"
      ? "Bluetooth の操作を実行します。たとえばプロファイル切替や切断です。"
      : "Completes a Bluetooth action given on press, for example switching between devices.";
  }
  if (normalizedName.includes("sticky") && normalizedName.includes("layer")) {
    return language === "ja"
      ? "次のキーが押されるまでレイヤーを有効にし、その後で解除します。"
      : "Activates a layer until another key is pressed, then deactivates it.";
  }
  if (normalizedName.includes("sticky") && normalizedName.includes("key")) {
    return language === "ja"
      ? "次のキーが押されるまでキーを押下状態に保ち、その後で解除します。"
      : "A sticky key stays pressed until another key is pressed.";
  }
  if (normalizedName.includes("layer")) {
    return language === "ja"
      ? "キーボードのレイヤー状態を制御する behavior です。"
      : "Controls layer state for the keyboard.";
  }
  if (normalizedName.includes("mouse")) {
    return language === "ja"
      ? "マウスボタン、カーソル移動、スクロールなどのマウスイベントを送ります。"
      : "Mouse emulation behaviors send mouse events, including mouse button presses, cursor movement and scrolling.";
  }
  if (normalizedName.includes("toggle")) {
    return language === "ja"
      ? "押すたびに設定や入力状態を切り替えます。"
      : "Toggles a setting or input state on each press.";
  }
  if (param1Type && param2Type) {
    return language === "ja"
      ? `この behavior には 2 つの設定があり、${param1Type} と ${param2Type} を使います。`
      : `This behavior uses two settings: a ${param1Type} and a ${param2Type}.`;
  }
  if (param1Type) {
    return language === "ja"
      ? `この behavior は ${param1Type} を 1 つ設定します。`
      : `This behavior uses one ${param1Type} setting.`;
  }
  return language === "ja"
    ? `${name} は入力や状態を制御する behavior です。詳細は公式ドキュメントを参照してください。`
    : `${name} controls keyboard input or state. See the official docs for details.`;
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
  values: BehaviorParameterValueDescription[] | undefined,
  language: HelpLanguage
) {
  const valueType = describeValueType(values);
  if (valueType === "key") {
    return language === "ja" ? "キー" : "Key";
  }
  if (valueType === "layer") {
    return language === "ja" ? "レイヤー" : "Layer";
  }
  if (valueType === "number") {
    return language === "ja" ? "値" : "Value";
  }
  if (valueType === "option") {
    return language === "ja"
      ? parameterIndex === 1 ? "選択肢" : "詳細"
      : parameterIndex === 1 ? "Option" : "Detail";
  }
  return language === "ja"
    ? parameterIndex === 1 ? "パラメータ 1" : "パラメータ 2"
    : parameterIndex === 1 ? "Param 1" : "Param 2";
}

function getParameterLabel(
  behaviorName: string,
  parameterIndex: 1 | 2,
  values: BehaviorParameterValueDescription[] | undefined,
  language: HelpLanguage
) {
  const help = behaviorHelpByName[normalizeBehaviorName(behaviorName)];
  const overrideLabel = parameterIndex === 1 ? help?.param1Label : help?.param2Label;
  if (overrideLabel) {
    return overrideLabel[language];
  }
  if (!values || values.length === 0) {
    return undefined;
  }
  if (values.length === 1 && values[0].name) {
    return values[0].name;
  }
  return getParameterLabelFromType(parameterIndex, values, language);
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
  const defaultLanguage: HelpLanguage =
    typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("ja")
      ? "ja"
      : "en";
  const [language, setLanguage] = useLocalStorageState<HelpLanguage>(
    "behaviorHelpLanguage",
    defaultLanguage
  );

  if (!behavior) {
    return null;
  }

  const help = behaviorHelpByName[normalizeBehaviorName(behavior.displayName)];
  const metadataSet = getMatchingMetadataSet(behavior.metadata, binding, layers);
  const description = help?.description[language] || buildGenericDescription(behavior, metadataSet, language);
  const docsUrl = getDocsUrl(behavior.displayName);
  const param1Label = getParameterLabel(behavior.displayName, 1, metadataSet?.param1, language);
  const param2Label = getParameterLabel(behavior.displayName, 2, metadataSet?.param2, language);
  const param1Value = describeParameterValue(binding.param1, metadataSet?.param1, layers);
  const param2Value = describeParameterValue(binding.param2, metadataSet?.param2, layers);
  const languageLabel = useMemo(
    () => language === "ja"
      ? { docs: "ZMK ドキュメントを開く", none: "なし", language: "言語" }
      : { docs: "Open ZMK docs", none: "None", language: "Language" },
    [language]
  );

  return (
    <div className="rounded border border-base-300 bg-base-100 p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium">{behavior.displayName}</div>
        <label className="flex items-center gap-2 text-sm text-base-content/70">
          <span>{languageLabel.language}</span>
          <select
            className="h-8 rounded border border-base-300 bg-base-100 px-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value as HelpLanguage)}
          >
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>
      </div>
      <p className="mt-1 text-base-content/70">{description}</p>
      <a
        className="mt-2 inline-block text-sm font-medium text-primary underline underline-offset-2"
        href={docsUrl}
        target="_blank"
        rel="noreferrer"
      >
        {languageLabel.docs}
      </a>
      {(param1Label || param2Label) && (
        <div className="mt-3 grid gap-1.5">
          {param1Label && (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <div className="text-base-content/60">{param1Label}</div>
              <div>{param1Value || languageLabel.none}</div>
            </div>
          )}
          {param2Label && (
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <div className="text-base-content/60">{param2Label}</div>
              <div>{param2Value || languageLabel.none}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
