import Link from 'next/link';

const FEATURES = [
  {
    href: '/mind-cloud',
    icon: '☁️',
    title: 'Mind Cloud',
    description:
      'Visual word cloud of the most-discussed topics across financial institution security ' +
      'in the last 30 days. Sized by frequency, color-coded by category.',
    badge: '30-day view',
    color: 'from-verint-purple to-verint-purple-light',
  },
  {
    href: '/market-trends',
    icon: '📈',
    title: 'Market Trends',
    description:
      'Top 20 trending news articles and intelligence reports from the FI security world. ' +
      'Each summarized in under 200 words with direct links to the source.',
    badge: '7-day view',
    color: 'from-verint-purple-mid to-verint-purple-light',
  },
];

const SOURCES = [
  { name: 'NewscatcherAPI', icon: '📰', desc: 'Real-time news aggregation' },
  { name: 'GDELT Project', icon: '🌐', desc: 'Global event database' },
  { name: 'KrebsOnSecurity', icon: '🔒', desc: 'Cybersecurity reporting' },
  { name: 'FS-ISAC', icon: '🏦', desc: 'Financial services threat intel' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-verint-gradient text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-15 rounded-full
                          px-4 py-1.5 text-sm font-medium mb-6 border border-white border-opacity-20">
            <span className="w-2 h-2 rounded-full bg-green-400 live-pulse" />
            Updated daily at 5:00 AM Eastern Time
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight mb-4">
            Verint FI Intelligence
          </h1>
          <p className="text-verint-purple-pale text-xl mb-3 font-medium">
            Financial Institution Security Market Intelligence
          </p>
          <p className="text-white text-opacity-75 max-w-2xl mx-auto text-base leading-relaxed mb-10">
            Real-time intelligence on bank robbery, ATM theft, cybercrime, and fraud trends —
            built to help Verint&#39;s sales team connect meaningfully with financial institutions
            in their territory.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/market-trends"
              className="bg-white text-verint-purple font-bold px-8 py-4 rounded-xl
                         hover:bg-verint-purple-pale transition-all shadow-lg hover:shadow-xl
                         text-base"
            >
              View Market Trends →
            </Link>
            <Link
              href="/mind-cloud"
              className="bg-verint-purple bg-opacity-50 text-white font-bold px-8 py-4 rounded-xl
                         border border-white border-opacity-30 hover:bg-opacity-70 transition-all
                         text-base"
            >
              Explore Mind Cloud
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-verint-gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-verint-purple-dark mb-2">
            Intelligence Tools
          </h2>
          <p className="text-center text-gray-500 mb-10 text-sm">
            Two views of the same market — choose your lens
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {FEATURES.map((f) => (
              <Link
                key={f.href}
                href={f.href}
                className="group bg-white rounded-2xl overflow-hidden border border-verint-purple-pale
                           shadow-verint hover:shadow-verint-lg transition-all hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-br ${f.color} p-6 text-white`}>
                  <div className="text-4xl mb-3">{f.icon}</div>
                  <h3 className="text-xl font-bold">{f.title}</h3>
                  <span className="inline-block mt-2 bg-white bg-opacity-20 text-xs px-3 py-1
                                   rounded-full font-medium border border-white border-opacity-20">
                    {f.badge}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-gray-600 text-sm leading-relaxed">{f.description}</p>
                  <div className="mt-4 text-verint-purple font-semibold text-sm flex items-center gap-1
                                  group-hover:gap-2 transition-all">
                    Explore {f.title} <span>→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Keywords */}
      <section className="py-12 px-4 bg-white border-y border-verint-purple-pale">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg font-bold text-verint-purple-dark mb-5 text-center">
            Monitoring These Threat Categories
          </h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: 'Robberies', icon: '🔫' },
              { label: 'Cyberattacks', icon: '💻' },
              { label: 'ATM Theft', icon: '🏧' },
              { label: 'Skimming', icon: '💳' },
              { label: 'Jackpotting', icon: '🎰' },
              { label: 'Hook & Chain', icon: '⛓️' },
              { label: 'Phishing', icon: '🎣' },
              { label: 'Ransomware', icon: '🔐' },
              { label: 'Fraud', icon: '⚠️' },
              { label: 'Data Breaches', icon: '📋' },
            ].map(({ label, icon }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-verint-purple-bg text-verint-purple-dark
                           border border-verint-purple-pale px-4 py-2 rounded-full text-sm font-medium"
              >
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Sources */}
      <section className="py-12 px-4 bg-verint-gray">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-lg font-bold text-verint-purple-dark mb-6">Data Sources</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {SOURCES.map((s) => (
              <div
                key={s.name}
                className="bg-white rounded-xl border border-verint-purple-pale p-4 text-center shadow-sm"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="font-semibold text-verint-purple-dark text-sm">{s.name}</div>
                <div className="text-xs text-gray-400 mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — hidden until login/signup is re-enabled
      <section className="py-12 px-4 bg-verint-gradient text-white text-center">
        <h2 className="text-2xl font-bold mb-3">Get Personalized Territory Reports</h2>
        <p className="text-verint-purple-pale mb-6 max-w-xl mx-auto text-sm">
          Sign up to unlock state-specific intelligence tailored to your sales territory,
          plus optional SMS alerts for breaking FI security news.
        </p>
        <Link
          href="/auth/signup"
          className="inline-block bg-white text-verint-purple font-bold px-8 py-4
                     rounded-xl hover:bg-verint-purple-pale transition-all shadow-lg text-base"
        >
          Request Access →
        </Link>
      </section>
      */}
    </div>
  );
}
