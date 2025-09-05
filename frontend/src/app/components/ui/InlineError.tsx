'use client';


export default function InlineError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-4 text-center text-danger-red">
      {message}
    </p>
  );
}
