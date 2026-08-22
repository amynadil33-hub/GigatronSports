import Layout from '@/components/Layout';

const CONTENT: Record<string, { title: string; body: string[] }> = {
  privacy: {
    title: 'PRIVACY POLICY',
    body: [
      'Gigatron Sports respects your privacy. We only collect the information required to process your orders and enquiries — such as your name, mobile number, email address and delivery address.',
      'Your information is never sold. It is used solely to fulfil orders, arrange delivery and respond to your enquiries.',
      'You may request removal of your details at any time by contacting us on +960 7964444.',
    ],
  },
  terms: {
    title: 'TERMS & CONDITIONS',
    body: [
      'All prices are listed in Maldivian Rufiyaa (MVR) and are subject to change without notice. Availability is confirmed by our team after an order is placed.',
      'Orders are confirmed by a Gigatron representative via WhatsApp or phone before delivery. Payment methods available include cash on delivery and bank transfer.',
      'Products carry the manufacturer or Gigatron warranty stated on the product page. Warranty does not cover physical or liquid damage.',
    ],
  },
};

export default function Legal({ page }: { page: 'privacy' | 'terms' }) {
  const c = CONTENT[page];
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{c.title}</h1>
        <div className="mt-8 space-y-5 text-neutral-600 leading-relaxed">
          {c.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </Layout>
  );
}
