import { MessageType } from '../utils/message';
import type { Message } from '../definitions';
import { readResponseAsDataURL } from '../utils/network';
import { callFetchMethod } from './fetch';

function initChrome() {
  if (typeof chrome === 'undefined') return;

  if (typeof window !== 'undefined' && !window.chrome) {
    window.chrome = {} as any;
  }
  if (typeof chrome !== 'undefined' && !chrome.runtime) {
    chrome.runtime = {} as any;
  }

  const messageListeners = new Set<(message: Message) => void>();

  async function sendMessage(...args: any[]) {
    if (args[0] && args[0].type === MessageType.CS_FETCH) {
      const { id } = args[0];
      try {
        const { url, responseType } = args[0].data;
        const response = await callFetchMethod(url);
        let text: string;
        if (responseType === 'data-url') {
          text = await readResponseAsDataURL(response);
        } else {
          text = await response.text();
        }
        messageListeners.forEach((cb) => cb({ type: MessageType.BG_FETCH_RESPONSE, data: text, error: null, id }));
      } catch (error) {
        console.error(error);
        messageListeners.forEach((cb) => cb({ type: MessageType.BG_FETCH_RESPONSE, data: null, error, id }));
      }
    }
  }

  function addMessageListener(callback: (data: any) => void) {
    messageListeners.add(callback);
  }

  if (typeof chrome.runtime.sendMessage === 'function') {
    const nativeSendMessage = chrome.runtime.sendMessage;
    chrome.runtime.sendMessage = (...args: any[]) => {
      sendMessage(...args);
      nativeSendMessage.apply(chrome.runtime, args);
    };
  } else {
    chrome.runtime.sendMessage = sendMessage;
  }

  if (!chrome.runtime.onMessage) {
    chrome.runtime.onMessage = {} as any;
  }
  if (typeof chrome.runtime.onMessage.addListener === 'function') {
    const nativeAddListener = chrome.runtime.onMessage.addListener;
    chrome.runtime.onMessage.addListener = (...args: any[]) => {
      addMessageListener(args[0]);
      nativeAddListener.apply(chrome.runtime.onMessage, args);
    };
  } else {
    chrome.runtime.onMessage.addListener = (...args: any[]) => addMessageListener(args[0]);
  }
}

initChrome();
