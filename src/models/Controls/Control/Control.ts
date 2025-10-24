export abstract class Control {
  protected abstract state: string;
  static stateData: Array<{
    name: string;
    imageUrl: string;
  }>;
  protected abstract element: HTMLElement;
  public abstract getElement(): HTMLElement;
}
