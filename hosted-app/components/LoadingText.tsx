'use client';

interface LoadingTextProps {
  text: string;
}

export default function LoadingText({ text }: LoadingTextProps) {
  return (
    <span className="inline-flex items-center">
      {text}
      <span className="inline-flex w-[1.2em] justify-start ml-0.5">
        <span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
      </span>
    </span>
  );
}
