import type { ColoredBall } from "../../types/game";
import type {
  ApplyDefaultColor,
  CalculateColoredBallScore,
  CreateColoredBall,
  GetRandomDefaultColor,
  IsValidHexColor,
  NormalizeColor,
  NormalizeColoredBalls,
  ValidateColoredBall,
} from "./types";

const MAX_COLORED_BALLS = 10;
const FALLBACK_COLOR = "#ffffff";
const COLOR_PALETTE = ["#f97316", "#22c55e", "#3b82f6", "#a855f7", "#eab308", "#ef4444"] as const;
const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/;

function sanitizeLabel(label: string): string {
  return label.trim();
}

function createColoredBallId(label: string, nominal: number): string {
  const baseLabel = sanitizeLabel(label).toLowerCase().replace(/\s+/g, "-") || "ball";
  const nominalPart = Number.isFinite(nominal) ? nominal.toString().replace(".", "_") : "nan";
  return `colored-${baseLabel}-${nominalPart}`;
}

export const isValidHexColor: IsValidHexColor = (color) => {
  if (typeof color !== "string") {
    return false;
  }

  return HEX_COLOR_REGEX.test(color.trim().toLowerCase());
};

export const normalizeColor: NormalizeColor = (value) => {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  return isValidHexColor(normalized) ? normalized : FALLBACK_COLOR;
};

export const applyDefaultColor: ApplyDefaultColor = (ball) => ({
  ...ball,
  color: normalizeColor(ball.color),
});

export const getRandomDefaultColor: GetRandomDefaultColor = () => {
  const index = Math.floor(Math.random() * COLOR_PALETTE.length);
  return COLOR_PALETTE[index];
};

export const createColoredBall: CreateColoredBall = (label, nominal, color = FALLBACK_COLOR) => ({
  id: createColoredBallId(label, nominal),
  label: sanitizeLabel(label),
  nominal: Number(nominal),
  color: normalizeColor(color),
});

export const validateColoredBall: ValidateColoredBall = (ball) => {
  const withColor = applyDefaultColor(ball);

  return (
    withColor.id.trim().length > 0 &&
    withColor.label.trim().length > 0 &&
    Number.isFinite(withColor.nominal) &&
    withColor.nominal > 0 &&
    isValidHexColor(withColor.color)
  );
};

export const calculateColoredBallScore: CalculateColoredBallScore = (nominal, count) => {
  if (!Number.isFinite(nominal) || nominal <= 0) {
    throw new RangeError("Nominal must be a finite number greater than 0.");
  }

  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("Count must be an integer greater than or equal to 0.");
  }

  return nominal * count;
};

export const normalizeColoredBalls: NormalizeColoredBalls = (list) => {
  const seenLabels = new Set<string>();
  const normalized: ColoredBall[] = [];

  for (const ball of list) {
    if (normalized.length >= MAX_COLORED_BALLS) {
      break;
    }

    const candidate = createColoredBall(ball.label, ball.nominal, ball.color);
    const normalizedLabelKey = candidate.label.toLocaleLowerCase();

    if (!validateColoredBall(candidate) || seenLabels.has(normalizedLabelKey)) {
      continue;
    }

    seenLabels.add(normalizedLabelKey);
    normalized.push(candidate);
  }

  return normalized;
};
