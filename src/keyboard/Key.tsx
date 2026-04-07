import { PropsWithChildren } from "react";
import type { ReactNode } from "react";
import BehaviorShortNames from "./behavior-short-names.json";

interface KeyProps {
  selected?: boolean;
  width: number;
  height: number;
  oneU: number;
  header?: string;
  primaryText?: string;
  footer?: ReactNode;
  title?: string;
  onClick?: () => void;
}

interface BehaviorShortName {
  short?: string;
}

const MAX_HEADER_LENGTH = 9;
const shortNames: Record<string, BehaviorShortName> = BehaviorShortNames;

const shortenHeader = (header: string | undefined) => {
  if(typeof header === "undefined"){
    return "";
  }
  // Empty string is a valid header for behaviors where we don't want to see a header, which is falsy
  // So we use an undefined check here
  if(typeof shortNames[header]?.short !== "undefined"){
    return shortNames[header].short;
  } else if(header.length > MAX_HEADER_LENGTH){
    const words = header.split(/[\s,-]+/);
    const lettersPerWord = Math.trunc(MAX_HEADER_LENGTH / words.length);
    return words.map((word) => (word.substring(0,lettersPerWord))).join("");
  } else {
    return header;
  }
}

function getPrimaryTextStyle(
  text: string | undefined,
  width: number,
  height: number,
  hasFooter: boolean,
  oneU: number
) {
  const textLength = Math.max((text || "").trim().length, 1);
  const pixelWidth = width * oneU;
  const pixelHeight = height * oneU;
  const horizontalPadding = 12;
  const reservedHeight = hasFooter ? 24 : 18;
  const availableWidth = Math.max(pixelWidth - horizontalPadding, 16);
  const availableHeight = Math.max(pixelHeight - reservedHeight, 12);
  const estimatedCharWidth = textLength <= 2 ? 0.72 : textLength <= 4 ? 0.64 : 0.58;

  let fontSizePx = Math.min(
    availableHeight * 0.82,
    availableWidth / Math.max(textLength * estimatedCharWidth, 1)
  );

  if (textLength >= 6) {
    fontSizePx *= 0.94;
  }
  if (textLength >= 8) {
    fontSizePx *= 0.92;
  }
  if (textLength >= 10) {
    fontSizePx *= 0.9;
  }

  return {
    fontSize: `${Math.max(fontSizePx / 16, 0.5)}rem`,
    lineHeight: "1",
  };
}

export const Key = ({
  selected = false,
  width,
  height,
  oneU,
  header,
  primaryText,
  footer,
  title,
  onClick,
  children,
}: PropsWithChildren<KeyProps>) => {
  const pixelWidth = width * oneU - 2;
  const pixelHeight = height * oneU - 2;
  const primaryTextStyle = getPrimaryTextStyle(primaryText, width, height, !!footer, oneU);

  return (
    <button
      className={`group rounded relative flex justify-center items-center cursor-pointer transition-all hover:shadow-xl hover:ring-1 hover:ring-gray-300 hover:scale-125 ${selected ? "bg-primary text-primary-content" : "bg-base-100 text-base-content"
        }`}
      style={{
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`,
      }}
      title={title}
      onClick={onClick}
    >
      <div className={`absolute text-xs ${selected ? "text-primary-content" : "text-base-content"} opacity-80 top-1 text-nowrap left-1/2 font-light -translate-x-1/2 text-center`}>{shortenHeader(header)}</div>
      <div className="flex h-full max-w-full flex-col items-center justify-center gap-0.5 overflow-hidden px-1 pt-4 pb-3 text-center">
        <div
          className="max-w-full whitespace-nowrap font-medium tracking-[-0.04em]"
          style={primaryTextStyle}
        >
          {children}
        </div>
      </div>
      {footer && (
        <div className={`absolute bottom-1 left-1/2 max-w-[85%] -translate-x-1/2 text-[9px] font-light leading-none truncate ${selected ? "text-primary-content/80" : "text-base-content/70"}`}>
          {footer}
        </div>
      )}
    </button>
  );
};
