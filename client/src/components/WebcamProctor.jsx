import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Shield, User, Users, UserMinus, Smartphone } from 'lucide-react';

const WebcamProctor = ({ onViolation }) => {
    const webcamRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [detecting, setDetecting] = useState(false);
    const [lastFaceCount, setLastFaceCount] = useState(1);
    const [noFaceCounter, setNoFaceCounter] = useState(0);
    const [objectModel, setObjectModel] = useState(null);
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);

    // 1. LOAD MODELS
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            console.log("🔍 Initializing Proctoring Models...");

            // Wait for TFJS to be ready
            try {
                await tf.ready();
            } catch (e) {
                console.error("❌ TFJS Ready Error:", e);
            }

            // Load Face-API Models (Required for proctoring)
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
                ]);
                console.log("✅ Face-API Models Loaded");
            } catch (e) {
                console.error("❌ Error loading face-api models:", e);
                // We don't return here so it can still try to set modelsLoaded or show error
            }

            // Load COCO-SSD (Optional AI feature) with a timeout
            try {
                const cocoPromise = cocoSsd.load();
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout loading COCO-SSD")), 8000)
                );

                const model = await Promise.race([cocoPromise, timeoutPromise]);
                setObjectModel(model);
                console.log("✅ COCO-SSD Model Loaded");
            } catch (e) {
                console.warn("⚠️ AI Phone Detection failed to load (timeout or offline), but proctoring will continue:", e.message);
            }

            setModelsLoaded(true);
        };
        loadModels();
    }, []);

    // 2. DETECTION LOOP (Every 1 second for higher accuracy and responsiveness)
    useEffect(() => {
        let interval;
        if (modelsLoaded) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                    setDetecting(true);
                    const video = webcamRef.current.video;

                    // 1. FACE DETECTION
                    const detections = await faceapi.detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    );

                    const count = detections.length;
                    setLastFaceCount(count);

                    // LOGIC: NO FACE
                    if (count === 0) {
                        setNoFaceCounter(prev => prev + 1);
                        // Grace period of 2 cycles (~2 seconds total if interval is 1s)
                        if (noFaceCounter >= 2) {
                            onViolation("NO_FACE_DETECTED", "No user visible in camera");
                            setNoFaceCounter(0); 
                        }
                    } else {
                        setNoFaceCounter(0);
                    }

                    // 2. LOGIC: MULTIPLE FACES
                    if (count > 1) {
                        onViolation("MULTIPLE_FACES", `${count} faces detected in frame`);
                    }

                    // 3. LOGIC: OBJECT DETECTION (Phones/Books)
                    if (objectModel) {
                        const predictions = await objectModel.detect(video);
                        
                        // Look for 'cell phone' or 'remote' (common mirror for phones in COCO-SSD)
                        // Lowered threshold to 0.45 for better recall as requested
                        const phone = predictions.find(p => 
                            (p.class === 'cell phone' || p.class === 'remote') && p.score > 0.45
                        );

                        if (phone) {
                            console.log(`📱 AI Detected: ${phone.class} with confidence ${Math.round(phone.score * 100)}%`);
                            setIsPhoneDetected(true);
                            onViolation("MOBILE_PHONE_DETECTED", `Mobile phone detected (${Math.round(phone.score * 100)}% confidence)`);
                        } else {
                            setIsPhoneDetected(false);
                        }
                    }

                    setDetecting(false);
                }
            }, 1000); // Reduced from 3000ms to 1000ms
        }
        return () => clearInterval(interval);
    }, [modelsLoaded, noFaceCounter, onViolation, objectModel]);

    const [isMinimized, setIsMinimized] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (isMinimized) {
        return (
            <div 
                className="position-fixed z-3 shadow-lg cursor-pointer animate-fade-in" 
                style={{ 
                    bottom: isMobile ? '80px' : '20px', 
                    right: '20px',
                    width: '40px',
                    height: '40px'
                }}
                onClick={() => setIsMinimized(false)}
            >
                <div className="w-100 h-100 rounded-circle bg-primary d-flex align-items-center justify-content-center text-white">
                    <Shield size={20} />
                </div>
            </div>
        );
    }

    return (
        <div 
            className="position-fixed z-3 p-2 animate-fade-in" 
            style={{ 
                width: isMobile ? '140px' : '200px',
                // On mobile, position it at the top-right (below navbar)
                // On desktop, keep it at bottom-right
                top: isMobile ? '70px' : 'auto',
                bottom: isMobile ? 'auto' : '0',
                right: '0',
                transition: 'all 0.3s ease'
            }}
        >
            <div className="glass-panel rounded-3 overflow-hidden border border-white border-opacity-10 shadow-lg position-relative">
                <button 
                    className="btn btn-sm p-1 position-absolute top-0 end-0 z-3 text-white-50 hover-text-white bg-dark bg-opacity-25"
                    onClick={() => setIsMinimized(true)}
                    style={{ border: 'none' }}
                >
                    <X size={14} />
                </button>
                <div className="bg-dark bg-opacity-50 p-2 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1">
                        <Shield size={12} className={modelsLoaded ? "text-success" : "text-warning"} />
                        <span style={{ fontSize: '0.65rem' }} className="fw-bold text-white-50 uppercase tracking-tighter">
                            {modelsLoaded ? "Secure" : "Init..."}
                        </span>
                    </div>
                </div>

                <div className="position-relative bg-black" style={{ height: isMobile ? '90px' : '120px' }}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-100 h-100 object-fit-cover opacity-75"
                        videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
                    />

                    {/* Status Overlays */}
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none">
                        {lastFaceCount === 0 && (
                            <div className="bg-danger bg-opacity-25 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-danger">
                                <UserMinus size={32} />
                                <span className="fw-bold" style={{ fontSize: '0.5rem' }}>NO USER</span>
                            </div>
                        )}
                        {lastFaceCount > 1 && (
                            <div className="bg-warning bg-opacity-25 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-warning">
                                <Users size={32} />
                                <span className="fw-bold" style={{ fontSize: '0.5rem' }}>MULTIPLE USERS</span>
                            </div>
                        )}
                        {isPhoneDetected && (
                            <div className="bg-danger bg-opacity-25 w-100 h-100 d-flex flex-column align-items-center justify-content-center text-danger">
                                <Smartphone size={32} className="animate-pulse" />
                                <span className="fw-bold" style={{ fontSize: '0.5rem' }}>PHONE DETECTED</span>
                            </div>
                        )}
                        {lastFaceCount === 1 && (
                            <div className="position-absolute top-0 end-0 p-1">
                                <div className="p-1 rounded-circle bg-success shadow-sm" style={{ width: '8px', height: '8px' }}></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-2 bg-dark bg-opacity-50 d-flex justify-content-center">
                    <div className={`badge ${lastFaceCount === 1 ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${lastFaceCount === 1 ? 'success' : 'danger'} border border-${lastFaceCount === 1 ? 'success' : 'danger'} border-opacity-25`} style={{ fontSize: '0.6rem' }}>
                        {lastFaceCount === 1 ? "User Verified" : lastFaceCount === 0 ? "Tracking Lost" : "Suspicious Activity"}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebcamProctor;
