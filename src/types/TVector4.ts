type TVector4 = {
  x: number;
  y: number;
  z: number;
  w: number;
};

type TVector4Limits = Record<keyof TVector4, { min?: number; max?: number }>;

export type { TVector4, TVector4Limits };
