export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time: string;
};

export type Thread = {
  id: string;
  title: string;
  dateLabel: string;
  messages: Message[];
};

export const initialThreads: Thread[] = [
  {
    id: 'th-brief',
    title: 'A sharper product brief',
    dateLabel: 'TODAY',
    messages: [
      { id: 'm1', role: 'user', content: 'Help me turn a rough idea into a concise product brief.', time: '10:42 AM' },
      { id: 'm2', role: 'assistant', content: 'Absolutely. Start with the person you want to help and the moment they need you. A strong brief makes that moment unmistakable before it describes the product.', time: '10:42 AM' },
    ],
  },
  {
    id: 'th-reading',
    title: 'Notes from the long read',
    dateLabel: 'YESTERDAY',
    messages: [
      { id: 'm3', role: 'user', content: 'What makes a good research summary?', time: '4:16 PM' },
      { id: 'm4', role: 'assistant', content: 'A useful summary keeps the argument intact, separates evidence from interpretation, and gives the reader a clear next question.', time: '4:17 PM' },
    ],
  },
  {
    id: 'th-voice',
    title: 'Finding a warmer voice',
    dateLabel: 'MONDAY',
    messages: [
      { id: 'm5', role: 'user', content: 'Rewrite this update so it sounds warm, not over-polished.', time: '9:08 AM' },
      { id: 'm6', role: 'assistant', content: 'Keep one honest detail, use everyday verbs, and let the sentence breathe. Warmth usually comes from what you leave in—not an extra layer of polish.', time: '9:08 AM' },
    ],
  },
];

export const promptSuggestions = [
  { number: '01', title: 'Untangle a thought', detail: 'Turn a rough idea into a clear next step.', prompt: 'Help me untangle this idea and find the clearest next step.' },
  { number: '02', title: 'Read between lines', detail: 'Find the signal in a long piece of text.', prompt: 'Help me find the main signal in a long piece of writing.' },
  { number: '03', title: 'Make it sound like me', detail: 'Shape a draft without sanding off its edges.', prompt: 'Help me make this draft clearer while keeping my voice.' },
];

export function makeLocalReply(prompt: string): string {
  const subject = prompt.trim().replace(/[?.!]+$/, '');
  return `Let's give this a little shape.\n\n**The useful signal**\nStart with the part that matters most in “${subject}”. Keep the context that changes the answer; set the rest aside for now.\n\n**A clear next move**\nWrite one sentence that names what you know, then one that names what is still open. That gives us a solid place to build from.\n\nWant to go deeper? Add a little more context and we can work through it together.`;
}
