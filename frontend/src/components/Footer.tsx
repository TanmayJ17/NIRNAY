import { FOOTER_TEXT } from '@/config';

export default function Footer() {
  return (
    <footer className="h-8 bg-surface border-t border-border flex items-center justify-between px-4 shrink-0 text-[11px] text-muted">
      <div className="flex items-center gap-1.5 overflow-hidden">
        <svg className="w-3.5 h-3.5 text-status-amber shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-semibold text-ink uppercase tracking-wider whitespace-nowrap">
          OPERATIONAL ADVISORY:
        </span>
        <span className="text-muted truncate ml-1">
          {FOOTER_TEXT}
        </span>
      </div>
      <div className="hidden lg:block text-muted whitespace-nowrap ml-4 text-[10px]">
        Independent prototype for Delhi PWD workflows. Not an official PWD product.
      </div>
    </footer>
  );
}
