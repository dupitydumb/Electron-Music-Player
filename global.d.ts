// global.d.ts

interface Window {
  ipcRenderer: {
    on(arg0: string, arg1: (event: any, message: any) => void): unknown;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
  };
  electronAPI: {
    runCmd: (command: any) => void;
    onCmdOutput: (callback: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
  };

  Howler: any;
}
