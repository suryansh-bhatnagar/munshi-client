import React, { useState, useRef, useEffect } from 'react';
import { useMutation, gql } from '@apollo/client';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

const ASK_MUNSHI = gql`
  mutation AskMunshi($message: String!, $sessionId: String) {
    askMunshi(message: $message, sessionId: $sessionId) {
      text
      sessionId
    }
  }
`;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  const [askMunshi, { loading }] = useMutation(ASK_MUNSHI);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'ai', text: "Hi! I'm Munshi, your AI assistant. Ask me anything about your business, like 'Who owes me money?' or 'What is my current inventory?'" }]);
    }
  }, [isOpen, messages.length]);

  // Reset session when chat is closed and reopened
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    // Start a fresh conversation
    setMessages([]);
    setSessionId(null);
    setIsOpen(true);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    try {
      const { data } = await askMunshi({ 
        variables: { 
          message: userMessage, 
          sessionId: sessionId 
        } 
      });
      setMessages(prev => [...prev, { role: 'ai', text: data.askMunshi.text }]);
      setSessionId(data.askMunshi.sessionId);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter creates new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50 flex items-center justify-center ${isOpen ? 'scale-0' : 'scale-100 hover:-translate-y-1'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 z-50 border border-gray-200 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-50 opacity-0 pointer-events-none'}`}
      >
        {/* Header */}
        <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">M</div>
            <div>
              <h3 className="font-semibold text-sm">Munshi AI</h3>
              <p className="text-xs text-primary-foreground/80">Business Assistant</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-primary-foreground/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-br-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm prose prose-sm prose-p:leading-relaxed prose-pre:bg-gray-100 prose-pre:text-gray-800'
              }`}>
                {/* Very basic markdown rendering for AI responses */}
                {msg.role === 'ai' ? (
                  <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 rounded-2xl p-3 rounded-bl-sm shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex items-end space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Munshi..."
              rows={1}
              className="flex-1 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 transition-colors px-4 py-2 text-sm resize-none outline-none max-h-24 overflow-y-auto"
              disabled={loading}
              style={{ minHeight: '40px', height: 'auto' }}
              onInput={(e) => { const t = e.target as HTMLTextAreaElement; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 96) + 'px'; }}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={loading || !input.trim()}
              className="rounded-full shadow-sm hover:shadow transition-all shrink-0"
            >
              <Send className="w-4 h-4 ml-1" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
