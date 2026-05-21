export function ValueStrip() {
  const items = [
    {
      icon: 'eye',
      title: 'Essayage hybride',
      body: 'Basic gratuit & instantané, ou Premium photo-réaliste par IA — 1er essai offert.',
    },
    {
      icon: 'leaf',
      title: 'Cheveux humains 100%',
      body: 'Sélectionnés à la main, traités sans silicone agressif.',
    },
    {
      icon: 'truck',
      title: 'Livraison France 48h',
      body: 'Suivi en temps réel · retours gratuits sous 30 jours.',
    },
    {
      icon: 'heart',
      title: 'Élodie 24/7',
      body: 'Notre styliste IA conseille et accompagne chaque commande.',
    },
  ];

  return (
    <div className="value-strip">
      {items.map((v) => (
        <div className="value" key={v.title}>
          <div className="value-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {v.icon === 'eye' && (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
              {v.icon === 'leaf' && (
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.5 2c.5 5-.5 8.5-2 10.5-2 2.5-6 3-5.5 7.5" />
              )}
              {v.icon === 'truck' && (
                <path d="M1 3h15v13H1z M16 8h4l3 3v5h-7z" />
              )}
              {v.icon === 'heart' && (
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              )}
            </svg>
          </div>
          <h4>{v.title}</h4>
          <p>{v.body}</p>
        </div>
      ))}
    </div>
  );
}
