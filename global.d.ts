// global.d.ts

interface Window {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    send: (channel: string, ...args: any[]) => void;
  };
  electronAPI: {
    runCmd: (command: any) => void;
    onCmdOutput: (callback: any) => void;
  };

  Howler: any;
}
