import * as react_jsx_runtime from 'react/jsx-runtime';

declare function ChatUI({ apiKey, openAi, }: {
    apiKey: string;
    openAi?: string;
}): react_jsx_runtime.JSX.Element | null;

interface HostieChatOptions {
    apiKey: string;
    openAi?: string;
    containerId?: string;
}
declare function init({ apiKey, openAi, containerId, }: HostieChatOptions): void;

export { ChatUI, init };
