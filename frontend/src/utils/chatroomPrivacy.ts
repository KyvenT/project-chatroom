import type { ChatroomPrivacy } from "../types/REST-types/Chatroom";

export const privacyOptions: {
  value: ChatroomPrivacy;
  label: string;
  hint: string;
}[] = [
  {
    value: "INVITE_ONLY",
    label: "Only owner can invite",
    hint: "Only the owner can invite new members.",
  },
  {
    value: "INVITE_PLUS",
    label: "Members can invite",
    hint: "Any member can invite new members.",
  },
  {
    value: "JOINABLE",
    label: "Any user can join by link",
    hint: "Anyone with an account can join using the chatroom's link.",
  },
  {
    value: "PUBLIC",
    label: "Guests can join by link",
    hint: "Anyone with the link can join, including guests.",
  },
];

export const privacyHint = (privacy: ChatroomPrivacy) =>
  privacyOptions.find((option) => option.value === privacy)?.hint;
