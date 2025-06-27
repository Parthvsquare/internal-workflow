export interface IActionHandler {
  handle(message: any): Promise<void | boolean>;
}
