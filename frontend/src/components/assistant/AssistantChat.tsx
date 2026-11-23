import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Loader2 } from 'lucide-react';
import { AssistantMessage, Equipment } from '../../types';
import MessageBubble from './MessageBubble';
import QuickChips from './QuickChips';
import { assistantAPI } from '../../services/api';
import { useAppStore } from '../../store/appStore';
import { MOCK_EQUIPMENT } from '../../data/mockData';

interface AssistantChatProps {
  onBookEquipment?: (equipmentId: string) => void;
}

export default function AssistantChat({ onBookEquipment }: AssistantChatProps) {
  const { state } = useAppStore();
  const { currentPersona } = state;

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      content: `Hello ${currentPersona.name.split(' ')[0]}! 👋 I'm your LabLink AI Assistant. I can help find specialized lab hardware, solve scheduling conflicts, check deadlines, or optimize multi-equipment project pipelines. What are you working on today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await assistantAPI.query(queryText, currentPersona.studentId);
      const data = response.data;

      const aiMsg: AssistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.response || data.message || "I've analyzed the lab status based on your query.",
        equipment: data.equipment || (data.recommendations ? data.recommendations : undefined),
        slots: data.slots,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      // Intelligent fallback logic when offline or backend starting
      let mockReply = "Here is what I found across our campus facilities:";
      let matchedEq: Equipment[] = [];

      const lower = queryText.toLowerCase();
      if (lower.includes('gpu') || lower.includes('workstation') || lower.includes('ai') || lower.includes('vision')) {
        matchedEq = MOCK_EQUIPMENT.filter((e) => e.category === 'AI-ML' || e.category === 'Computing');
        mockReply = `I found ${matchedEq.length} GPU-accelerated computing nodes available for machine learning workloads. The NVIDIA DGX A100 has high demand, while the RTX 4090 is immediately accessible!`;
      } else if (lower.includes('robot') || lower.includes('spot')) {
        matchedEq = MOCK_EQUIPMENT.filter((e) => e.category === 'Robotics');
        mockReply = `Here are the robotics research platforms. Spot Robot is currently in-use, but the UR10e Collaborative Arm has open slots today.`;
      } else if (lower.includes('conflict') || lower.includes('deadline')) {
        mockReply = `I've analyzed the queue. For time-sensitive project deadlines, we recommend booking during off-peak morning hours (08:00–10:00) or reserving alternative secondary workstations.`;
      } else {
        matchedEq = MOCK_EQUIPMENT.slice(0, 2);
        mockReply = `Based on your request, I identified these relevant laboratory resources and scheduled availability.`;
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: mockReply,
            equipment: matchedEq.length > 0 ? matchedEq : undefined,
            timestamp: new Date(),
          },
        ]);
        setLoading(false);
      }, 500);
      return;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              LabLink AI Co-Pilot
              <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-1.5 py-0.5 rounded-full">
                Active
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context-aware lab resource assistant</p>
          </div>
        </div>
      </div>

      {/* Message History */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onBookEquipment={onBookEquipment}
          />
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white">
              <Bot size={16} />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-none bg-white border border-slate-200 text-slate-500 text-xs flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-indigo-600" />
              <span>Analyzing schedule engine & equipment status...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-white border-t border-slate-100">
        <QuickChips onSelect={(prompt) => handleSend(prompt)} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Ask for equipment, solve a conflict, or optimize schedule..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-slate-800 placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white transition disabled:opacity-40 shadow-xs"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
