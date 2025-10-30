export type TApiReturn<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
    };
