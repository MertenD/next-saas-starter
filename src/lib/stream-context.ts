import { createResumableStreamContext } from "resumable-stream";

let streamContext: ReturnType<typeof createResumableStreamContext> | undefined;

export function getStreamContext() {
  if (!streamContext) {
    streamContext = createResumableStreamContext({ waitUntil: null });
  }
  return streamContext;
}
