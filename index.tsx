import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";

// --- TYPES ---
interface Shot {
  sceneHeader: string;
  action: string;
  cameraAngle: string;
  visualDescription: string;
  imageUrl?: string;
  isLoadingImage?: boolean;
}

interface AnalysisResult {
  score: string;
  genre: string;
  audience: string;
  strengths: string[];
  weaknesses: string[];
  casting: Array<{ name: string; match: number; image: string }>;
}

// --- CONSTANTS ---
const DEFAULT_SCRIPT = `INT. COFFEE SHOP - DAY

A rain-streaked window. Soft jazz plays.

JAMIE (30s, disheveled) stares at a cold cup of coffee.

He looks up as the door chime rings.

A WOMAN in a red trench coat enters, shaking off an umbrella.
She spots Jamie. Freezes.

Jamie stands up, knocking over his chair. The sound cuts through the jazz.`;

// Placeholder images for casting (reusing from original HTML logic concept)
const ACTOR_IMAGES = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
];

// --- COMPONENTS ---

const Header = () => (
  <header className="fixed w-full top-0 z-50 shadow-sm" style={{ background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(229, 231, 235, 0.5)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-20">
        <div className="logo text-2xl font-bold text-indigo-600 tracking-tighter">
          CineMatch AI
        </div>
        <nav className="hidden md:flex space-x-8 items-center">
          <a href="#problema" className="text-gray-600 hover:text-indigo-600 font-medium">El Problema</a>
          <a href="#solucion" className="text-gray-600 hover:text-indigo-600 font-medium">La Solución</a>
          <a href="#simulador" className="text-indigo-600 font-bold">Simulador</a>
          <a href="#modelo" className="text-gray-600 hover:text-indigo-600 font-medium">Precios</a>
          <button className="btn-primary px-4 py-2 !text-white rounded-lg hover:!text-white">Conecta</button>
        </nav>
      </div>
    </div>
  </header>
);

const Hero = () => (
  <section className="text-center mb-20 pt-10">
    <p className="text-indigo-600 font-semibold tracking-wide uppercase mb-4">Validación de guiones basada en Data Science.</p>
    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
      No dejes el éxito al azar, <br className="hidden md:block" /> <span className="text-gradient">haz Match</span>.
    </h1>
    <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
      CineMatch AI transforma la incertidumbre creativa en éxito medible, proporcionando a las productoras datos predictivos y sugerencias de casting inteligentes.
    </p>
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="#simulador" className="btn-primary px-8 py-4 text-lg inline-block pulse no-underline">
        PROBAR SIMULADOR
      </a>
    </div>
  </section>
);

const Simulator = () => {
  const [view, setView] = useState<"input" | "processing" | "results">("input");
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [shots, setShots] = useState<Shot[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  const processScript = async () => {
    setView("processing");
    setProcessingStep(1);

    // Initialize AI here to ensure we capture the API key if it was just set
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      // 1. ANALYZE SCRIPT & GENERATE SHOTS PROMPTS
      const textResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `Analyze the following movie script.
        
        Part 1: General Analysis
        - Score (1-10)
        - Genre
        - Target Audience
        - 3 Key Strengths
        - 3 Key Weaknesses
        - 3 Casting Suggestions (Name + Match %)

        Part 2: Visual Breakdown
        Break the script down into a sequence of 3-4 key visual shots for a storyboard.
        For each shot provide: Scene Header, Action, Camera Angle, Visual Description (optimized for image gen).

        Script:
        ${script}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    audience: { type: Type.STRING },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                    casting: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: { name: { type: Type.STRING }, match: { type: Type.NUMBER } } 
                        } 
                    }
                }
              },
              shots: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    sceneHeader: { type: Type.STRING },
                    action: { type: Type.STRING },
                    cameraAngle: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                  },
                  required: ["sceneHeader", "action", "cameraAngle", "visualDescription"],
                },
              },
            },
          },
        },
      });

      const data = JSON.parse(textResponse.text || "{}");
      
      // Map analysis data
      setAnalysis({
          ...data.analysis,
          casting: data.analysis.casting.map((c: any, i: number) => ({ ...c, image: ACTOR_IMAGES[i % ACTOR_IMAGES.length] }))
      });
      
      setShots(data.shots || []);
      setProcessingStep(2); // Analysis done

      // 2. GENERATE IMAGES (Parallel)
      const shotsWithImages = [...(data.shots || [])];
      setView("results"); // Show results early while images load
      
      // Trigger Image Gen
      data.shots.forEach((shot: Shot, index: number) => {
          generateShotImage(shot, index);
      });

      // 3. GENERATE VIDEO (Parallel)
      generateVideo(script);

    } catch (error) {
      console.error("Error processing script:", error);
      alert("Error processing script. Please try again.");
      setView("input");
    }
  };

  const generateShotImage = async (shot: Shot, index: number) => {
    // Initialize AI per request to be safe with contexts
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    setShots(prev => {
        const copy = [...prev];
        if(copy[index]) copy[index].isLoadingImage = true;
        return copy;
    });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [
            { text: `Cinematic storyboard sketch, loose charcoal style. ${shot.visualDescription}. Angle: ${shot.cameraAngle}` },
          ],
        },
      });

      let imageUrl = "";
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      setShots(prev => {
        const copy = [...prev];
        if(copy[index]) {
            copy[index].imageUrl = imageUrl;
            copy[index].isLoadingImage = false;
        }
        return copy;
      });

    } catch (err) {
      console.error("Image gen error", err);
      setShots(prev => {
        const copy = [...prev];
        if(copy[index]) copy[index].isLoadingImage = false;
        return copy;
      });
    }
  };

  const generateVideo = async (scriptText: string) => {
      // Initialize AI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      setIsVideoLoading(true);
      try {
          // Check for API key selection for Veo specifically
          // @ts-ignore
          if(window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function' && !await window.aistudio.hasSelectedApiKey()) {
             // If key not selected, we might fail or prompt. For now, proceed as prompt suggests env is injected.
          }

          // Use Veo for video generation
          let operation = await ai.models.generateVideos({
              model: 'veo-3.1-fast-generate-preview',
              prompt: `Cinematic movie scene based on this script: ${scriptText.substring(0, 300)}...`,
              config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
              }
          });

          // Polling
          while (!operation.done) {
              await new Promise(resolve => setTimeout(resolve, 5000));
              operation = await ai.operations.getVideosOperation({operation: operation});
          }

          const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
          if (videoUri) {
              // Fetch the actual bytes
              const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
              const videoBlob = await videoResponse.blob();
              const videoObjectUrl = URL.createObjectURL(videoBlob);
              setVideoUrl(videoObjectUrl);
          }

      } catch (err) {
          console.error("Video generation failed", err);
      } finally {
          setIsVideoLoading(false);
      }
  };

  return (
    <section id="simulador" className="mb-16">
      <div className="card p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🎬 Simulador de Validación y Storyboard</h2>
          <p className="text-gray-600">Sube tu guion o escribe una escena para un análisis con ScriptSense™ y generación visual.</p>
        </div>

        <div className="simulator-container bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden min-h-[500px]">
          
          {/* INPUT VIEW */}
          {view === "input" && (
            <div className="p-8">
               <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pega tu escena aquí:</label>
                  <textarea 
                    className="w-full h-64 p-4 bg-gray-50 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="INT. LOCATION - DAY..."
                  />
               </div>
               <div className="text-center">
                  <button onClick={processScript} className="btn-primary px-8 py-3 text-lg shadow-lg">
                    <i className="fas fa-magic mr-2"></i> Analizar y Generar Storyboard
                  </button>
               </div>
            </div>
          )}

          {/* PROCESSING VIEW */}
          {view === "processing" && (
            <div className="text-center py-20 px-8">
              <div className="spinner w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Procesando Guion...</h3>
              <div className="max-w-md mx-auto text-left space-y-4">
                <div className={`flex items-center space-x-3 ${processingStep >= 1 ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                    <i className="fas fa-brain"></i> <span>Analizando texto y sentimiento...</span>
                </div>
                <div className={`flex items-center space-x-3 ${processingStep >= 2 ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                    <i className="fas fa-image"></i> <span>Generando storyboard...</span>
                </div>
                <div className={`flex items-center space-x-3 ${processingStep >= 3 ? 'text-indigo-600 font-bold' : 'text-gray-400'}`}>
                    <i className="fas fa-video"></i> <span>Renderizando video preliminar...</span>
                </div>
              </div>
            </div>
          )}

          {/* RESULTS VIEW */}
          {view === "results" && analysis && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="text-xl font-bold text-gray-800">Resultados del Análisis</h3>
                  <button onClick={() => setView("input")} className="text-indigo-600 text-sm hover:underline">Analizar otro</button>
              </div>

              <div className="grid md:grid-cols-3 gap-8 mb-8">
                {/* Left Col: Analysis Stats */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">CineMatch Score</div>
                        <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            {analysis.score}/10
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Género</div>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">{analysis.genre}</span>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Público</div>
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">{analysis.audience}</span>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-2">Casting Sugerido</div>
                        <div className="space-y-3">
                            {analysis.casting.map((actor, idx) => (
                                <div key={idx} className="flex items-center bg-white p-2 rounded border border-gray-100 shadow-sm">
                                    <img src={actor.image} className="w-8 h-8 rounded-full object-cover mr-3" />
                                    <div>
                                        <div className="text-sm font-bold">{actor.name}</div>
                                        <div className="text-xs text-green-600">{actor.match}% Match</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Col: Storyboard & Video */}
                <div className="md:col-span-2 space-y-8">
                    
                    {/* Video Section */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                            <i className="fas fa-video mr-2 text-indigo-600"></i> Video Conceptual (Beta)
                        </h4>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                            {videoUrl ? (
                                <video controls autoPlay loop className="w-full h-full object-cover">
                                    <source src={videoUrl} type="video/mp4" />
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="text-white text-center">
                                    <div className="spinner border-white border-t-indigo-500 mb-2"></div>
                                    <p className="text-sm opacity-80">{isVideoLoading ? "Generando video con Veo..." : "Esperando inicio..."}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Storyboard Section */}
                    <div>
                        <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                            <i className="fas fa-images mr-2 text-indigo-600"></i> Storyboard Generado
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {shots.map((shot, idx) => (
                                <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                                        {shot.imageUrl ? (
                                            <img src={shot.imageUrl} className="w-full h-full object-cover" alt="Storyboard shot" />
                                        ) : (
                                            <div className="text-gray-400 text-sm flex flex-col items-center">
                                                {shot.isLoadingImage && <div className="spinner w-6 h-6 border-2 border-gray-300 border-t-indigo-600 mb-2"></div>}
                                                <span>{shot.isLoadingImage ? "Generando imagen..." : "Pendiente"}</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                                            SHOT {idx + 1}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <div className="text-xs font-bold text-indigo-600 uppercase mb-1">{shot.cameraAngle}</div>
                                        <p className="text-sm text-gray-600 line-clamp-2">{shot.action}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const App = () => {
  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 fade-in">
        <Hero />
        <Simulator />
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-4 text-2xl font-bold text-gray-400 tracking-tighter">
               CineMatch AI
            </div>
            <p className="text-gray-500 text-sm mb-2">&copy; 2025 CineMatch AI. Un proyecto impulsado por la innovación y la Data Science.</p>
            <p className="text-gray-400 text-xs">Hecho con Google Gemini & Veo.</p>
        </div>
      </footer>
    </>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);