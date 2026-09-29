import { usePopoutStore } from "../../hooks/usePopoutStore";

// Document Picture-in-Picture (Chrome and Edge 116+): a small window that
// stays on top of other apps and shares this page's JavaScript
interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

const WINDOW_SIZE = { width: 360, height: 520 };

export const isChatWindowSupported = () =>
  typeof window !== "undefined" && !!window.documentPictureInPicture;

// Moves a chat into the chat window, opening the window if needed. Must be
// called from a click, as browsers only open the window in response to one.
// Returns false (leaving the chat where it was) if the window can't open.
export const openChatWindow = async (chatroomId: string) => {
  let chatWindow = usePopoutStore.getState().chatWindow;

  if (!chatWindow || chatWindow.closed) {
    if (!window.documentPictureInPicture) return false;
    try {
      chatWindow =
        await window.documentPictureInPicture.requestWindow(WINDOW_SIZE);
    } catch (err) {
      console.error("couldn't open the chat window", err);
      return false;
    }
    chatWindow.document.title = "Chat";
    // closed with its own close button, or by the browser
    chatWindow.addEventListener(
      "pagehide",
      () => usePopoutStore.getState().clearWindow(),
      { once: true },
    );
    usePopoutStore.getState().setChatWindow(chatWindow);
  }

  usePopoutStore.getState().openInWindow(chatroomId);
  chatWindow.focus();
  return true;
};
