import { MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/gigatron';

const WHATSAPP_NUMBER = '9607845555';

export default function WhatsAppButton() {
  return (
    <a
      href={waLink(WHATSAPP_NUMBER, 'Hello Gigatron Sports, I would like to make an enquiry.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Gigatron Sports on WhatsApp at 7845555"
      className="group fixed bottom-5 right-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[#25D366] px-4 text-white shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:bg-[#20bd5a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6 fill-current" aria-hidden="true" />
      <span className="hidden pr-1 text-sm font-extrabold sm:inline">WhatsApp 7845555</span>
    </a>
  );
}
