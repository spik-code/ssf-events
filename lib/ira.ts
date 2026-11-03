/** Shared bits of Ira, the SSF lotus mascot (IraGuide + IraChat + EnquiryForm). */

/** Fired once an enquiry is saved (by the form or by Ira's chat), so Ira can celebrate. */
export const ENQUIRY_SENT_EVENT = "ssf:enquiry-sent";

export type Lang = "en" | "kn";

export type Face =
  | "smile"
  | "blink"
  | "wow"
  | "laugh"
  | "think"
  | "wave"
  | "sleepy"
  | "cheer"
  | "wink";

export const FACES: Face[] = ["smile", "blink", "wow", "laugh", "think", "wave", "sleepy", "cheer", "wink"];

export const faceSrc = (f: Face) => `/brand/ira-${f}.webp`;
