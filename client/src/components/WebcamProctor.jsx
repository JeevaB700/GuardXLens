import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from '@vladmandic/face-api';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { Shield, User, Users, UserMinus, Smartphone, X } from 'lucide-react';

const WebcamProctor = ({ onViolation }) => {
    const webcamRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [lastFaceCount, setLastFaceCount] = useState(1);
    const [objectModel, setObjectModel] = useState(null);
    const [isPhoneDetected, setIsPhoneDetected] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // High performance tracking refs (prevents UI re-renders on every inference tick)
    const noFaceCounterRef = useRef(0);
    const multipleFaceCounterRef = useRef(0);
    const phoneCounterRef = useRef(0);
    const prevCountRef = useRef(1);
    const prevPhoneRef = useRef(false);
    const isProcessingRef = useRef(false);
    const objectCycleCounterRef = useRef(0);

    // 1. LOAD MODELS
    useEffect(() => {
        const loadModels = async () => {
            const MODEL_URL = '/models';
            console.log("🔍 Initializing Proctoring Models...");

            // Wait for TFJS to be ready
            try {
                if (faceapi.tf) {
                    await faceapi.tf.ready();
                }
            } catch (e) {
                console.error("❌ TFJS Ready Error:", e);
            }

            // Load Face-API Models (Required for proctoring)
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
                console.log("✅ Face-API Models Loaded");
            } catch (e) {
                console.error("❌ Error loading face-api models:", e);
            }

            // Load COCO-SSD (Optional AI feature) with a timeout - DISABLE ON MOBILE FOR PERFORMANCE
            const isMobileDevice = window.innerWidth < 768;
            if (!isMobileDevice) {
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
            } else {
                console.log("ℹ️ Mobile Device Detected: Disabled COCO-SSD for performance.");
            }

            setModelsLoaded(true);
        };
        loadModels();
    }, []);

    // Violation Throttling ref to prevent violation flood while keeping detection reliable
    const lastViolationRef = useRef({});
    const triggerViolation = (type, message, minIntervalMs = 6000) => {
        const now = Date.now();
        if (!lastViolationRef.current[type] || (now - lastViolationRef.current[type] > minIntervalMs)) {
            lastViolationRef.current[type] = now;
            onViolation(type, message);
        }
    };

    // 2. BALANCED HIGH-ACCURACY DETECTION LOOP (Smooth 60fps UI, No main thread lag, Zero false alarms)
    useEffect(() => {
        let isMounted = true;
        let timerId = null;

        const runDetection = async () => {
            if (!isMounted) return;

            if (modelsLoaded && webcamRef.current && webcamRef.current.video) {
                const video = webcamRef.current.video;
                // ReadyState >= 2 (HAVE_CURRENT_DATA) ensures frames are active
                if (!isProcessingRef.current && video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
                    isProcessingRef.current = true;
                    const isMobileDevice = window.innerWidth < 768;

                    try {
                        // 1. HIGH ACCURACY FACE DETECTION
                        // inputSize: 160 on mobile for speed, 224 on desktop
                        // scoreThreshold: 0.28 prevents false "no face" when looking down at keyboard or questions
                        const inputSize = isMobileDevice ? 160 : 224;
                        const scoreThreshold = isMobileDevice ? 0.30 : 0.28;
                        const detections = await faceapi.detectAllFaces(
                            video,
                            new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold })
                        );

                        const count = detections.length;

                        // Only trigger React re-render when face count changes
                        if (prevCountRef.current !== count) {
                            prevCountRef.current = count;
                            setLastFaceCount(count);
                        }

                        // LOGIC: NO FACE
                        // 4 consecutive misses (~2.4s desktop, ~3.2s mobile) eliminates false warnings from blinking or looking down
                        if (count === 0) {
                            noFaceCounterRef.current += 1;
                            if (noFaceCounterRef.current >= 4) {
                                triggerViolation("NO_FACE_DETECTED", "No user visible in camera");
                            }
                        } else {
                            noFaceCounterRef.current = 0;
                        }

                        // 2. LOGIC: MULTIPLE FACES (Requires 2 consecutive frames ~1.2s to prevent single-frame artifacts)
                        if (count > 1) {
                            multipleFaceCounterRef.current += 1;
                            if (multipleFaceCounterRef.current >= 2) {
                                triggerViolation("MULTIPLE_FACES", `${count} faces detected in frame`);
                            }
                        } else {
                            multipleFaceCounterRef.current = 0;
                        }

                        // 3. OBJECT DETECTION (Desktop only, checked every 2 cycles)
                        if (objectModel && !isMobileDevice) {
                            objectCycleCounterRef.current = (objectCycleCounterRef.current + 1) % 2;
                            if (objectCycleCounterRef.current === 0) {
                                const predictions = await objectModel.detect(video);
                                const phone = predictions.find(p => 
                                    (p.class === 'cell phone' || p.class === 'remote') && p.score > 0.45
                                );

                                const phoneDetected = !!phone;
                                if (prevPhoneRef.current !== phoneDetected) {
                                    prevPhoneRef.current = phoneDetected;
                                    setIsPhoneDetected(phoneDetected);
                                }

                                if (phoneDetected) {
                                    phoneCounterRef.current += 1;
                                    if (phoneCounterRef.current >= 2) {
                                        triggerViolation("MOBILE_PHONE_DETECTED", `Mobile phone detected (${Math.round(phone.score * 100)}% confidence)`);
                                    }
                                } else {
                                    phoneCounterRef.current = 0;
                                }
                            }
                        }
                    } catch (err) {
                        console.warn("Proctoring frame skipped:", err?.message);
                    } finally {
                        isProcessingRef.current = false;
                    }
                }
            }

            // Balanced schedule: 600ms desktop, 800ms mobile gives 90%+ idle time for smooth typing and editor performance
            if (isMounted) {
                const cooldown = window.innerWidth < 768 ? 800 : 600;
                timerId = setTimeout(runDetection, cooldown);
            }
        };

        if (modelsLoaded) {
            timerId = setTimeout(runDetection, 600);
        }

        return () => {
            isMounted = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [modelsLoaded, onViolation, objectModel]);

    const [isMinimized, setIsMinimized] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const mobileVideoConstraints = {
        facingMode: "user",
        width: { ideal: 480 },
        height: { ideal: 360 }
    };

    return (
        <div 
            className="position-fixed z-3 p-2 animate-fade-in" 
            style={{ 
                width: isMinimized ? (isMobile ? '45px' : '50px') : (isMobile ? '150px' : '200px'),
                height: isMinimized ? (isMobile ? '45px' : '50px') : 'auto',
                top: isMobile ? (isMinimized ? 'auto' : '65px') : 'auto',
                bottom: isMinimized ? '20px' : (isMobile ? 'auto' : '0'),
                right: isMinimized ? '20px' : '0',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
        >
            {isMinimized ? (
                <div 
                    onClick={() => setIsMinimized(false)} 
                    className="w-100 h-100 rounded-circle bg-primary shadow-lg d-flex align-items-center justify-content-center text-white cursor-pointer hover-scale-110 position-relative border border-white border-opacity-25"
                >
                    <Shield size={isMobile ? 18 : 22} />
                    {/* Background Tracking: Kept hidden but mounted */}
                    <div style={{ position: 'absolute', opacity: 0, width: '1px', height: '1px', overflow: 'hidden', pointerEvents: 'none' }}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={mobileVideoConstraints}
                            onUserMedia={() => setCameraError(null)}
                            onUserMediaError={(err) => setCameraError(err.name || "Denied")}
                        />
                    </div>
                </div>
            ) : (
                <div className="glass-panel rounded-3 overflow-hidden border border-white border-opacity-10 shadow-lg position-relative animate-scale-up">
                    <button 
                        className="btn btn-sm p-1 position-absolute top-0 end-0 z-3 text-white-50 hover-text-white bg-dark bg-opacity-25"
                        onClick={() => setIsMinimized(true)}
                        style={{ border: 'none' }}
                    >
                        <X size={14} />
                    </button>
                    <div className="bg-dark bg-opacity-50 p-2 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-1">
                            <Shield size={12} className={modelsLoaded && !cameraError ? "text-success" : "text-warning"} />
                            <span style={{ fontSize: '0.65rem' }} className="fw-bold text-white-50 uppercase tracking-tighter">
                                {cameraError ? "Cam Error" : modelsLoaded ? "Active" : "Init..."}
                            </span>
                        </div>
                    </div>

                    <div className="position-relative bg-black" style={{ height: isMobile ? '100px' : '120px' }}>
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-100 h-100 object-fit-cover opacity-75"
                            videoConstraints={mobileVideoConstraints}
                            onUserMedia={() => setCameraError(null)}
                            onUserMediaError={(err) => {
                                console.error("Webcam Error:", err);
                                setCameraError(err.name || "Denied");
                            }}
                        />

                        {/* Status Overlays */}
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center pointer-events-none">
                            {cameraError ? (
                                <div className="bg-danger bg-opacity-75 w-100 h-100 p-2 d-flex flex-column align-items-center justify-content-center text-white text-center">
                                    <span className="fw-bold small">{cameraError}</span>
                                    <span style={{ fontSize: '0.55rem' }} className="opacity-75">Allow camera permission in browser</span>
                                </div>
                            ) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-2 bg-dark bg-opacity-50 d-flex justify-content-center">
                        <div className={`badge ${cameraError ? 'bg-warning text-dark' : lastFaceCount === 1 ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${cameraError ? 'warning' : lastFaceCount === 1 ? 'success' : 'danger'} border border-opacity-25`} style={{ fontSize: '0.6rem' }}>
                            {cameraError ? "Camera Blocked" : lastFaceCount === 1 ? "User Verified" : lastFaceCount === 0 ? "Tracking Lost" : "Suspicious Activity"}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebcamProctor;
