export default function lerp(x: number, y: number, a: number) {
  return x * (1 - a) + y * a;
}
