import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import type { Hotspot, ChatMessage } from '@/types';

interface AskNirnayPanelProps {
  hotspot: Hotspot;
}

export const AskNirnayPanel: React.FC<AskNirnayPanelProps> = ({ hotspot }) => {
  const [inputValue, setInputValue] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMessages = useStore((s) => s.chatMessages);
  const isChatLoading = useStore((s) => s.isChatLoading);
  const sendChatMessage = useStore((s) => s.sendChatMessage);

  const cleanHotspotName = hotspot.name.replace(' Underpass', '').replace(' Flyover', '');

  const suggestedChips = [
    `Why these pumps at ${cleanHotspotName}?`,
    `What if I close ${cleanHotspotName} instead?`,
    'How stable is this plan?',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim() || isChatLoading) return;
    setInputValue('');
    await sendChatMessage(text.trim(), hotspot.name);
  };

  const toggleSource = (msgId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  return (
    <div className="flex flex-col h-[520px] bg-white border border-border rounded-sm overflow-hidden mb-4">
      {/* Header */}
      <div className="p-3 border-b border-border bg-[#F9FAFB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[13px] font-semibold text-text-primary tracking-tight">
            Ask NIRNAY
          </span>
        </div>
        <span className="text-[11px] font-mono text-text-muted">
          SIMULATOR EXPLANATIONS
        </span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 panel-scroll bg-surface/30">
        {chatMessages.map((msg: ChatMessage) => {
          const isUser = msg.sender === 'user';
          const isSourceOpen = !!expandedSources[msg.id];
          const hasTools = msg.toolsInvoked && msg.toolsInvoked.length > 0;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-sm p-3 text-[13px] leading-relaxed border ${
                  isUser
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-primary border-border shadow-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Cached answer badge if applicable */}
                {!isUser && msg.isCached && (
                  <div className="mt-2 pt-1.5 border-t border-border/60 flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border/80">
                      Cached answer
                    </span>
                  </div>
                )}
              </div>

              {/* Collapsible Source: simulator output block for assistant replies */}
              {!isUser && (
                <div className="mt-1 max-w-[90%] w-full">
                  <button
                    onClick={() => toggleSource(msg.id)}
                    className="text-[11px] font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1 py-0.5"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${isSourceOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Source: simulator output</span>
                  </button>

                  {isSourceOpen && (
                    <div className="mt-1 p-2 bg-surface border border-border rounded-sm text-[11px]">
                      {hasTools ? (
                        <div className="space-y-1.5">
                          <table className="w-full text-left font-mono text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-border text-text-muted">
                                <th className="py-1 pr-2 font-medium">TOOL</th>
                                <th className="py-1 font-medium">PARAMETERS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {msg.toolsInvoked!.map((tool, idx) => (
                                <tr key={idx}>
                                  <td className="py-1 pr-2 text-primary font-semibold align-top whitespace-nowrap">
                                    {tool.tool}
                                  </td>
                                  <td className="py-1 text-text-secondary font-mono break-all align-top">
                                    {JSON.stringify(tool.args)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <span className="text-text-muted italic">
                          No simulator data used
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Three-dot typing indicator */}
        {isChatLoading && (
          <div className="flex items-center gap-1.5 p-3 max-w-[80px] bg-white border border-border rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:200ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-pulse [animation-delay:400ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested question chips */}
      <div className="p-2 border-t border-border bg-[#F9FAFB] flex flex-wrap gap-1.5">
        {suggestedChips.map((chip, idx) => (
          <button
            key={idx}
            disabled={isChatLoading}
            onClick={() => handleSend(chip)}
            className="text-[11px] px-2.5 py-1 rounded-sm border border-border bg-white text-text-secondary hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50 text-left"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="p-2.5 border-t border-border bg-white flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          disabled={isChatLoading}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask why, test a what-if, or inspect numbers..."
          className="flex-1 h-8 px-3 text-[13px] border border-border rounded-sm bg-white text-text-primary placeholder:text-text-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none disabled:bg-surface"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isChatLoading}
          className="h-8 px-3.5 bg-primary hover:bg-primary-hover disabled:bg-surface disabled:text-text-muted disabled:border disabled:border-border text-white text-[12px] font-medium rounded-sm transition-colors flex items-center justify-center shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AskNirnayPanel;
