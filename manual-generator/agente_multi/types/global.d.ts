declare global {
  interface Window {
    __name: (obj: any, name: string) => any;
  }
}