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

    // 2. DETECTION LOOP (Every 3 seconds)
    useEffect(() => {
        let interval;
        if (modelsLoaded) {
            interval = setInterval(async () => {
                if (webcamRef.current && webcamRef.current.video.readyState === 4) {
                    setDetecting(true);
                    const video = webcamRef.current.video;

                    const detections = await faceapi.detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    );

                    const count = detections.length;
                    setLastFaceCount(count);

                    // LOGIC: NO FACE
                    if (count === 0) {
                        setNoFaceCounter(prev => prev + 1);
                        // Grace period of 3 cycles (~9 seconds total if interval is 3s)
                        // but let's make it more sensitive for an exam
                        if (noFaceCounter >= 2) {
                            onViolation("NO_FACE_DETECTED", "No user visible in camera");
                            setNoFaceCounter(0); // Reset after flagging
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
                        const phone = predictions.find(p => p.class === 'cell phone' && p.score > 0.6);
                        if (phone) {
                            setIsPhoneDetected(true);
                            onViolation("MOBILE_PHONE_DETECTED", "Mobile phone visible in camera");
                        } else {
                            setIsPhoneDetected(false);
                        }
                    }

                    setDetecting(false);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [modelsLoaded, noFaceCounter, onViolation]);

    return (
        <div className="position-fixed bottom-0 end-0 p-3 z-3" style={{ width: '200px' }}>
            <div className="glass-panel rounded-3 overflow-hidden border border-white border-opacity-10 shadow-lg">
                <div className="bg-dark bg-opacity-50 p-2 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-1">
                        <Shield size={12} className={modelsLoaded ? "text-success" : "text-warning"} />
                        <span style={{ fontSize: '0.65rem' }} className="fw-bold text-white-50 uppercase tracking-tighter">
                            {modelsLoaded ? "Secure Proctor" : "Initializing..."}
                        </span>
                    </div>
                    {detecting && <div className="spinner-grow spinner-grow-sm text-primary" style={{ width: '8px', height: '8px' }}></div>}
                </div>

                <div className="position-relative bg-black" style={{ height: '120px' }}>
                    <Webcam
                        audio={false}
                        ref={webcamRef}
                        screenshotFormat="image/jpeg"
                        className="w-100 h-100 object-fit-cover opacity-75"
                        videoConstraints={{ width: 320, height: 240, facingMode: "user" }}
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
