import type { Player } from "../../types/game";

export type SettlementInputMap = Record<string, number>;

export type ValidateSettlementInputResult = {
  isValid: boolean;
  normalized: SettlementInputMap;
};

export type ValidateSettlementInput = (
  players: Player[],
  inputMap: SettlementInputMap
) => ValidateSettlementInputResult;

export type NetScoresResult = {
  netScores: Record<string, number>;
  isBalanced: boolean;
  totalSum: number;
};

export type CalculateNetScores = (
  playerOrder: string[],
  settlementInput: SettlementInputMap,
  penalties: Record<string, number>
) => NetScoresResult;
