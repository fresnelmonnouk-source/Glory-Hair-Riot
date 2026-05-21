'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { Tables } from '@/lib/supabase/types';

type UserProfile = Tables<'users'>;

export default function ProfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    street_address: '',
    city: '',
    postal_code: '',
    country: 'France',
    hair_type: '',
    skin_tone: '',
    accepts_marketing: true,
  });

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) {
        setProfile(data);
        setForm({
          full_name: data.full_name ?? '',
          phone: data.phone ?? '',
          street_address: data.street_address ?? '',
          city: data.city ?? '',
          postal_code: data.postal_code ?? '',
          country: data.country ?? 'France',
          hair_type: data.hair_type ?? '',
          skin_tone: data.skin_tone ?? '',
          accepts_marketing: data.accepts_marketing ?? true,
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = getSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: updateError } = await supabase
      .from('users')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
    fontFamily: 'var(--f-body)', fontSize: 14,
    background: 'var(--bg-warm)', color: 'var(--ink)',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 500,
    marginBottom: 6, color: 'var(--ink-soft)',
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ width: 32, height: 32, border: '2px solid var(--line)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', marginBottom: 6 }}>
          Espace client
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 36, letterSpacing: '-.01em' }}>
          Mon <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>profil</span>
        </h1>
      </div>

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Informations personnelles */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 28, border: '1px solid var(--line-soft)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 24 }}>
            Informations personnelles
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Prénom et nom</label>
              <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} style={inputStyle} placeholder="Yasmine Diallo" />
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={profile?.email ?? ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Téléphone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+33 6 00 00 00 00" />
            </div>
          </div>
        </div>

        {/* Adresse de livraison */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 28, border: '1px solid var(--line-soft)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 24 }}>
            Adresse de livraison
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Rue et numéro</label>
              <input type="text" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} style={inputStyle} placeholder="12 rue de la Paix" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Code postal</label>
                <input type="text" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} style={inputStyle} placeholder="75001" />
              </div>
              <div>
                <label style={labelStyle}>Ville</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inputStyle} placeholder="Paris" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Pays</label>
              <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle} />
            </div>
          </div>
        </div>

        {/* Préférences beauté */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 28, border: '1px solid var(--line-soft)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 24 }}>
            Préférences beauté
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Type de cheveux préféré</label>
              <select value={form.hair_type} onChange={(e) => setForm({ ...form, hair_type: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Non spécifié</option>
                <option value="straight">Lisse</option>
                <option value="wavy">Ondulé</option>
                <option value="curly">Bouclé</option>
                <option value="coily">Crépu</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Carnation</label>
              <select value={form.skin_tone} onChange={(e) => setForm({ ...form, skin_tone: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Non spécifiée</option>
                <option value="fair">Claire</option>
                <option value="medium">Médium</option>
                <option value="olive">Olive</option>
                <option value="brown">Brune</option>
                <option value="dark">Foncée</option>
              </select>
            </div>
          </div>
        </div>

        {/* Communications */}
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r-lg)', padding: 28, border: '1px solid var(--line-soft)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 24 }}>
            Communications
          </h2>
          <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
            <input
              type="checkbox"
              checked={form.accepts_marketing}
              onChange={(e) => setForm({ ...form, accepts_marketing: e.target.checked })}
              style={{ marginTop: 2, accentColor: 'var(--gold)', flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Newsletters & offres exclusives</div>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3, lineHeight: 1.5 }}>
                Recevez les nouvelles collections, tutoriels et promotions en avant-première.
              </div>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, alignItems: 'center' }}>
          {error && (
            <div style={{ fontSize: 13, color: 'var(--terracotta)', flex: 1 }}>{error}</div>
          )}
          {saved && (
            <div style={{ fontSize: 13, color: '#3a7a32', flex: 1 }}>✓ Profil mis à jour avec succès</div>
          )}
          {!error && !saved && <div style={{ flex: 1 }} />}
          <button type="submit" disabled={saving} style={{
            padding: '13px 28px',
            background: saving ? 'var(--ink-mute)' : 'var(--ink)',
            color: 'var(--bg-warm)', border: 'none',
            borderRadius: 'var(--r-md)', fontSize: 14, fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
