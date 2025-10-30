type TVector3 = {
  x: number;
  y: number;
  z: number;
};

type TVector3Limits = Record<keyof TVector3, { min?: number; max?: number }>;

export type { TVector3, TVector3Limits };
