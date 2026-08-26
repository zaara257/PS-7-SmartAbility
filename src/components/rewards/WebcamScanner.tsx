import React, { useEffect, useRef, useState } from 'react';
import * as tmImage from '@teachablemachine/image';
import Button from '../ui/Button';

interface WebcamScannerProps {
  onRewardDetected: (level: number) => void;
  unlockedCount: number;
}

export default function WebcamScanner({ onRewardDetected, unlockedCount }: WebcamScannerProps) {
  const modelUrl = import.meta.env.VITE_TEACHABLE_MACHINE_MODEL_URL || '';
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<tmImage.CustomMobileNet | null>(null);
  const webcamRef = useRef<tmImage.Webcam | null>(null);
  
  // State for what is currently detected
  const [detection, setDetection] = useState<string | null>(null);
  const [detectionProb, setDetectionProb] = useState<number>(0);
  
  const requestRef = useRef<number>();
  const consecutiveFrames = useRef<Record<string, number>>({});
  
  // A ref to store isScanning so the loop can access the latest value
  const isScanningRef = useRef(false);

  const startScanning = async () => {
    // Ensure URL ends with / if not empty
    let finalUrl = modelUrl.trim();
    if (!finalUrl) {
      setError("Model URL is not configured. Please check your .env file.");
      return;
    }
    if (!finalUrl.endsWith('/')) {
        finalUrl += '/';
    }
    
    // Fully clean up any previous state
    stopScanning();
    
    setLoading(true);
    setError(null);
    try {
      // Add a cache-buster query parameter to force the browser to download the latest weights
      const timestamp = new Date().getTime();
      const modelURL = finalUrl + "model.json?t=" + timestamp;
      const metadataURL = finalUrl + "metadata.json?t=" + timestamp;

      // Load the model and metadata only if not already loaded (or if we want to force reload, we should always load)
      // Since we want the latest, let's always load it when they click Start
      modelRef.current = await tmImage.load(modelURL, metadataURL);
      
      // Setup webcam
      const flip = true; // whether to flip the webcam
      const newWebcam = new tmImage.Webcam(300, 300, flip);
      await newWebcam.setup(); // request access to the webcam
      await newWebcam.play();
      webcamRef.current = newWebcam;
      
      if (videoRef.current) {
        videoRef.current.innerHTML = '';
        videoRef.current.appendChild(webcamRef.current.canvas);
      }
      
      setIsScanning(true);
      isScanningRef.current = true;
      
      // Start the loop directly
      requestRef.current = window.requestAnimationFrame(loop);
      
    } catch (err: any) {
      console.error("Webcam setup error:", err);
      setError("Failed to load model or access webcam. Check URL and permissions.");
      stopScanning(); // Clean up if failed
    } finally {
      setLoading(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    isScanningRef.current = false;
    
    if (requestRef.current) {
      window.cancelAnimationFrame(requestRef.current);
      requestRef.current = undefined;
    }

    if (webcamRef.current) {
      webcamRef.current.stop();
      
      // Explicitly stop hardware tracks to free the camera handle
      try {
        const videoElement = (webcamRef.current as any).webcam;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
          videoElement.srcObject = null;
        }
      } catch (e) {
        console.error("Error freeing webcam tracks:", e);
      }
      
      webcamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.innerHTML = '';
    }
    
    // Reset detection states
    setDetection(null);
    setDetectionProb(0);
    consecutiveFrames.current = {};
  };

  const loop = async () => {
    if (webcamRef.current && modelRef.current && isScanningRef.current) {
      webcamRef.current.update(); // update the webcam frame
      await predict();
      // Ensure we're still scanning after await
      if (isScanningRef.current) {
         requestRef.current = window.requestAnimationFrame(loop);
      }
    }
  };

  const [allPredictions, setAllPredictions] = useState<{className: string, probability: number}[]>([]);

  const predict = async () => {
    if (!modelRef.current || !webcamRef.current || !isScanningRef.current) return;
    
    // Use predict to get all classes instead of predictTopK to avoid any sorting bugs
    const predictions = await modelRef.current.predict(webcamRef.current.canvas);
    
    // Sort by probability descending
    predictions.sort((a, b) => b.probability - a.probability);
    
    setAllPredictions(predictions);
    
    if (predictions.length > 0) {
      const bestPrediction = predictions[0];
      setDetection(bestPrediction.className);
      setDetectionProb(bestPrediction.probability);
      
      // Require a very high confidence
      if (bestPrediction.probability > 0.95) {
        const cls = bestPrediction.className;
        consecutiveFrames.current[cls] = (consecutiveFrames.current[cls] || 0) + 1;
        
        // If detected 15 frames in a row
        if (consecutiveFrames.current[cls] > 15) {
            const levelMatch = cls.match(/\d/);
            if (levelMatch) {
              const level = parseInt(levelMatch[0], 10);
              if (level >= 1 && level <= 5) {
                if (level <= unlockedCount) {
                  stopScanning();
                  onRewardDetected(level);
                  consecutiveFrames.current = {};
                } else {
                  setError(`Level ${level} is currently locked!`);
                  consecutiveFrames.current[cls] = 0;
                }
              }
            }
        }
        
        Object.keys(consecutiveFrames.current).forEach(key => {
            if (key !== cls) {
                consecutiveFrames.current[key] = 0;
            }
        });
      } else {
         consecutiveFrames.current = {};
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 bg-white/50 p-6 rounded-3xl border border-leaf-green/20 w-full">
      <div className="flex items-center gap-2">
        <span className="text-3xl">📷</span>
        <h3 className="font-baloo text-xl font-bold text-bark-brown">
          Scan Reward Number
        </h3>
      </div>
      
      {!isScanning && (
        <div className="flex flex-col w-full max-w-md gap-3">
          <p className="text-sm text-soil-brown/80 text-center px-4 font-fredoka">
            Show a number (1-5) on camera to claim your reward!
          </p>
          <Button 
            variant="primary" 
            onClick={startScanning}
            disabled={loading}
            className="w-full py-3 mt-2"
          >
            {loading ? "Loading Scanner..." : "Start Scanner"}
          </Button>
          
          {error && (
            <div className="text-red-500 font-fredoka text-sm text-center bg-red-50 p-3 rounded-xl border border-red-200 mt-2">
              {error}
            </div>
          )}
        </div>
      )}

      <div 
        ref={videoRef} 
        className={`rounded-2xl overflow-hidden border-4 border-white shadow-lg ${!isScanning && 'hidden'}`}
        style={{ width: 300, height: 300, backgroundColor: '#f0f0f0' }}
      >
        {/* Webcam canvas goes here */}
      </div>
      
      {isScanning && (
        <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-md">
          <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-leaf-green/20 w-full justify-between">
            <span className="font-fredoka text-soil-brown">Top Detected:</span>
            <div className="flex items-center gap-2">
               <strong className="text-leaf-green font-baloo text-2xl">
                 {detection && detectionProb > 0.6 ? detection : "-"}
               </strong>
               {detection && detectionProb > 0.6 && (
                 <span className="text-soil-brown/60 font-fredoka text-sm bg-leaf-green/10 px-2 py-1 rounded-md">
                   {(detectionProb * 100).toFixed(0)}%
                 </span>
               )}
            </div>
          </div>
          
          <div className="w-full bg-white/80 rounded-xl p-3 text-xs font-mono text-soil-brown/70 grid grid-cols-2 gap-1 border border-leaf-green/10">
            {allPredictions.slice(0, 6).map(p => (
               <div key={p.className} className="flex justify-between">
                 <span>{p.className}:</span>
                 <span className={p.probability > 0.8 ? "text-leaf-green font-bold" : ""}>
                    {(p.probability * 100).toFixed(1)}%
                 </span>
               </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 font-fredoka text-sm text-center bg-red-50 p-2 rounded-xl w-full border border-red-200">
              {error}
            </div>
          )}
          <Button variant="ghost" onClick={stopScanning} className="w-full mt-2">
            Cancel Scanning
          </Button>
        </div>
      )}
    </div>
  );
}
