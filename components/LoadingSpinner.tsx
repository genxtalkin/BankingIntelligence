export default function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-verint-purple-pale" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-verint-purple animate-spin" />
      </div>
      <p className="text-verint-purple font-medium">{message}</p>
    </div>
  );
}
