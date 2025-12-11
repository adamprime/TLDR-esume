'use client';

interface LoadingTextProps {
  text: string;
}

export default function LoadingText({ text }: LoadingTextProps) {
  return (
    <span className="inline-flex items-center">
      {text}
      <span className="loading-dots"></span>
    </span>
  );
}
