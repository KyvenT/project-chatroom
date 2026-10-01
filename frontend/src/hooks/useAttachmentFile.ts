import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Attachment } from "../types/REST-types/Message";
import { attachmentKind, fetchAttachment } from "../utils/attachments";

// The type a file's blob is given. Blob URLs are shown by the browser as
// their type, so it's always one of the types the app knows how to show,
// never anything that could run as a page.
const blobType = (attachment: Attachment) => {
  const kind = attachmentKind(attachment.mimeType);
  return kind === "file" ? "application/octet-stream" : attachment.mimeType;
};

// A sent file's bytes, fetched once `enabled` and kept for the session, and a
// URL to show them with that's revoked on unmount
export const useAttachmentFile = (attachment: Attachment, enabled: boolean) => {
  const query = useQuery({
    queryKey: ["attachment", attachment.id],
    queryFn: async () =>
      new Blob([await fetchAttachment(attachment.id)], {
        type: blobType(attachment),
      }),
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!query.data) return;
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(undefined);
    };
  }, [query.data]);

  return {
    blob: query.data,
    url,
    isError: query.isError,
    isLoading: enabled && query.isPending && !query.isError,
  };
};
