import type { ColoredBall } from "../../types/game";

export type CreateColoredBall = (label: string, nominal: number, color?: string) => ColoredBall;

export type ValidateColoredBall = (ball: ColoredBall) => boolean;

export type CalculateColoredBallScore = (nominal: number, count: number) => number;

export type NormalizeColoredBalls = (list: ColoredBall[]) => ColoredBall[];

export type IsValidHexColor = (color: string) => boolean;

export type NormalizeColor = (value: string) => string;

export type ApplyDefaultColor = (ball: ColoredBall) => ColoredBall;

export type GetRandomDefaultColor = () => string;
