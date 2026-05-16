import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ChevronDown, Send } from 'lucide-react'
import SiteLayout from '@/components/SiteLayout'
import { useStoreBase } from '@/lib/store'
import { insertContact } from '@/lib/db'
import { toast } from 'sonner'

export const Route = createFileRoute('/faqs')({
  head: () => ({
    meta: [
      { title: "FAQ — AB Consult" },
      { name: "description", content: "Answers to frequently asked questions about AB Consult's venue booking and equipment rental services." },
      { property: "og:title", content: "FAQ — AB Consult" },
      { property: "og:description", content: "Frequently asked questions about our event venues and equipment rentals." },
      { property: "og:url", content: "https://abconsult.com/faqs" },
    ],
  }),
  component: Faqs,
})

function Faqs() {
  const faqs = useStoreBase(s => s.faqs).filter(f => f.published).sort((a, b) => a.order - b.order);
  const [open, setOpen] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const submitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSending(true);
    try {
      await insertContact({ name, email, phone, subject, message });
      toast.success('Message sent! We\'ll get back to you soon.');
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage('');
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <SiteLayout>
      <section className="pt-32 pb-10 bg-secondary border-b border-border">
        <div className="mx-auto max-w-3xl px-6 lg:px-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-3">Help</div>
          <h1 className="font-display text-5xl md:text-6xl">Frequently asked.</h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 lg:px-10 py-16 space-y-2">
        {faqs.map(f => (
          <div key={f.id} className="border border-border bg-card">
            <button onClick={() => setOpen(open === f.id ? null : f.id)}
              className="w-full flex items-center justify-between p-5 text-left">
              <span className="font-display text-xl">{f.question}</span>
              <ChevronDown className={`w-5 h-5 transition-transform ${open === f.id ? 'rotate-180' : ''}`}/>
            </button>
            {open === f.id && (
              <div className="px-5 pb-5 text-foreground/80 whitespace-pre-line">{f.answer}</div>
            )}
          </div>
        ))}
        {faqs.length === 0 && <p className="text-muted-foreground">No FAQs yet.</p>}
      </section>

      {/* Contact Us Form */}
      <section className="mx-auto max-w-3xl px-6 lg:px-10 pb-24">
        <div className="border border-border bg-card p-6 sm:p-10">
          <div className="text-[10px] uppercase tracking-[0.4em] text-gold mb-2">Get in touch</div>
          <h2 className="font-display text-3xl sm:text-4xl mb-2">Contact us</h2>
          <p className="text-muted-foreground mb-8">Have a question that isn't covered above? Send us a message and we'll respond promptly.</p>

          <form onSubmit={submitContact} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <input value={name} onChange={e => setName(e.target.value)} className="field" placeholder="Your name"/>
              </Field>
              <Field label="Email" required>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="field" placeholder="you@example.com"/>
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <input value={phone} onChange={e => setPhone(e.target.value)} className="field" placeholder="+234 ..."/>
              </Field>
              <Field label="Subject" required>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="field" placeholder="What is this about?"/>
              </Field>
            </div>
            <Field label="Message" required>
              <textarea rows={5} value={message} onChange={e => setMessage(e.target.value)} className="field" placeholder="Tell us how we can help..."/>
            </Field>
            <button type="submit" disabled={sending}
              className="inline-flex items-center gap-2 bg-gold text-gold-foreground px-8 py-4 text-xs uppercase tracking-[0.3em] hover:bg-gold/90 transition disabled:opacity-50">
              <Send className="w-4 h-4"/>
              {sending ? 'Sending...' : 'Send message'}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground block mb-1">
        {label}{required && <span className="text-gold ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
