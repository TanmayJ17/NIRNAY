import { FOOTER_TEXT } from '@/config';

export default function Footer() {
  return (
    <footer className="h-8 bg-white border-t border-border flex items-center px-4 shrink-0">
      <div className="flex items-center gap-1.5">
        <svg className="w-3.5 h-3.5 text-status-amber" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[11px] text-text-secondary font-medium">
          OPERATIONAL ADVISORY:
        </span>
      </div>
      <span className="text-[11px] text-text-muted ml-2">
        {FOOTER_TEXT}
      </span>
    </footer>
  );
}
