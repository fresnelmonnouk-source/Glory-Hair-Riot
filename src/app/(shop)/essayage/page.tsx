'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ConsentModal } from '@/components/tryon/ConsentModal';

export default function TryOnPage() {
  const [consentGiven, setConsentGiven] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAcceptConsent = async () => {
    setConsentGiven(true);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error('Erreur d\'accès à la caméra:', error);
      alert('Impossible d\'accéder à votre caméra. Vérifiez les permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setCameraActive(false);
      setConsentGiven(false);
    }
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(
          videoRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );

        const imageUrl = canvasRef.current.toDataURL('image/png');
        console.log('Snapshot capturé (pas envoyé):', imageUrl.substring(0, 50));
        // TODO: Implémenter la sauvegarde du snapshot via tRPC
      }
    }
  };

  useEffect(() => {
    return () => {
      if (cameraActive) {
        stopCamera();
      }
    };
  }, [cameraActive]);

  return (
    <main className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/catalogue" className="text-gold hover:underline text-sm mb-4 inline-block">
            ← Retour au catalogue
          </Link>
          <h1 className="text-4xl font-serif font-normal tracking-tight">
            Essayage virtuel
          </h1>
          <p className="text-lg text-ink-soft mt-4">
            Visualisez comment les perruques vous mettent en valeur avec notre
            technologie d'essayage virtuel (100% local, RGPD-compliant)
          </p>
        </div>

        {/* Consent Modal */}
        <ConsentModal
          isOpen={!consentGiven}
          onAccept={handleAcceptConsent}
          onDecline={() => {
            alert(
              'Vous devez accepter l\'accès à la caméra pour utiliser l\'essayage virtuel.'
            );
          }}
        />

        {/* Camera Section */}
        {consentGiven && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Video */}
            <div>
              <div className="bg-black rounded-lg overflow-hidden border-2 border-gold mb-4 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-96 object-cover"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={captureSnapshot}
                  className="flex-1 px-4 py-3 rounded-lg bg-gold text-white font-semibold hover:shadow-lg transition-all"
                >
                  📸 Capturer
                </button>

                <button
                  onClick={stopCamera}
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors font-semibold"
                >
                  Arrêter
                </button>
              </div>

              <p className="text-xs text-ink-soft text-center mt-4">
                Votre vidéo ne quitte jamais votre appareil
              </p>
            </div>

            {/* Canvas & Info */}
            <div>
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              <div className="bg-surface border border-line-soft rounded-lg p-6 space-y-4">
                <h3 className="font-serif text-lg">Tips d'utilisation</h3>

                <ul className="space-y-3 text-sm text-ink-soft">
                  <li className="flex gap-3">
                    <span className="text-gold font-bold">💡</span>
                    <span>
                      Assurez-vous que votre visage est bien visible et bien
                      éclairé
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-gold font-bold">💡</span>
                    <span>
                      Essayez différents angles pour voir comment la perruque
                      s'adapte
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-gold font-bold">💡</span>
                    <span>
                      Vous pouvez capturer vos meilleurs résultats pour les
                      partager
                    </span>
                  </li>
                </ul>

                <div className="pt-4 border-t border-line-soft">
                  <p className="text-xs text-ink-mute">
                    MediaPipe Face Mesh est utilisé pour l'analyse faciale.
                    Aucune donnée n'est stockée sans votre consentement.
                  </p>
                </div>
              </div>

              {/* Placeholder for wig selector */}
              <div className="mt-6 bg-bg-deep rounded-lg p-6">
                <h3 className="font-serif text-lg mb-4">Sélectionner une perruque</h3>
                <p className="text-sm text-ink-soft mb-4">
                  Intégration MediaPipe + sélecteur de perruques à venir
                </p>
                <Link
                  href="/catalogue"
                  className="inline-flex items-center gap-2 text-gold hover:underline font-semibold"
                >
                  Retour au catalogue
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14m-6-7 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
