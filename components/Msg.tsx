import React from "react";

type MsgProps = {
  title: string;
  message: string;
};

// Toast body: bold title followed by the message
export default function Msg({ title, message }: MsgProps) {
  return (
    <span>
      <span className="font-bold text-gray-200">{title}</span> {message}
    </span>
  );
}
