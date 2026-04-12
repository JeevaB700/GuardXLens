import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from "@monaco-editor/react";
import { Clock, Play, Terminal, Lock, ShieldAlert, AlertOctagon, CheckCircle, Maximize2, ChevronLeft, ChevronRight, Menu, X, Shield } from 'lucide-react';
import WebcamProctor from '../../components/WebcamProctor';
import API_BASE_URL from '../../config';

const TakeExam = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // --- STATE ---
    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);

    // Coding State
    const [selectedLanguage, setSelectedLanguage] = useState("java");
    const [testResults, setTestResults] = useState(null);
    const [allTestResults, setAllTestResults] = useState({}); // Track all Q results
    const [isRunning, setIsRunning] = useState(false);
    const [consoleOpen, setConsoleOpen] = useState(true);

    useEffect(() => {
        if (exam) document.title = `GuardXLens | ${exam.title}`;
    }, [exam]);

    // Security State
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isExamStarted, setIsExamStarted] = useState(false);
    const [violationCount, setViolationCount] = useState(0);
    const [showTerminationModal, setShowTerminationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showQuestionPalette, setShowQuestionPalette] = useState(false);
    
    // New Security Modal State
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityModalTitle, setSecurityModalTitle] = useState("");
    const [securityModalMessage, setSecurityModalMessage] = useState("");
    const [violationLogs, setViolationLogs] = useState([]);
    const [isFocusLost, setIsFocusLost] = useState(false);

    // REF
    const answersRef = useRef(answers);
    useEffect(() => { answersRef.current = answers; }, [answers]);
    const startedAtRef = useRef(null);

    const MAX_WARNINGS = 2;

    const getBoilerplate = (lang) => {
        if (lang === 'java') return `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input using sc.nextLine() or sc.nextInt()\n        \n        // Write your logic here\n        \n    }\n}`;
        if (lang === 'python') return `import sys\n\n# Read input from sys.stdin\n# for line in sys.stdin:\n#     print(line)\n\n# Write your logic here\n`;
        if (lang === 'c') return `#include <stdio.h>\n\nint main() {\n    // Use scanf() to read input\n    \n    // Write your logic here\n    \n    return 0;\n}`;
        if (lang === 'cpp') return `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Use cin >> to read input\n    \n    // Write your logic here\n    \n    return 0;\n}`;
        return `// Write Code`;
    };

    // 1. FETCH EXAM
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) return navigate('/login');

                const res = await axios.get(`${API_BASE_URL}/api/student/exam/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                if (res.data.success) {
                    setExam(res.data.exam);
                    setTimeLeft(res.data.exam.duration ? res.data.exam.duration * 60 : 3600);
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchExam();
    }, [id, navigate]);

    // 2. TIMER
    useEffect(() => {
        if (timeLeft <= 0 || !isExamStarted) return;
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [timeLeft, isExamStarted]);

    // --- SECURITY LOGIC ---
    const logViolation = async (action, details) => {
        // GUARD: Only log if exam is strictly active and not in process of submitting or finished
        if (!isExamStarted || isSubmitting || showSuccessModal || showTerminationModal) return;

        try {
            const token = sessionStorage.getItem('token');
            if (!token) return;
            await axios.post(`${API_BASE_URL}/api/log`, { examId: id, action, details }, { headers: { Authorization: `Bearer ${token}` } });
        } catch (e) { }
    };

    const submitExamData = async (finalAnswers, isMalpractice = false) => {
        try {
            setIsSubmitting(true);
            const token = sessionStorage.getItem('token');
            const user = JSON.parse(sessionStorage.getItem('user'));
            await axios.post(`${API_BASE_URL}/api/student/submit`, {
                examId: id,
                answers: finalAnswers,
                codingResults: allTestResults, 
                studentId: user?.id,
                isMalpractice,
                violationCount,
                violationLogs,
                startedAt: startedAtRef.current
            }, { headers: { Authorization: `Bearer ${token}` } });

            if (document.fullscreenElement) document.exitFullscreen().catch(() => { });

            if (!isMalpractice) {
                setShowSuccessModal(true);
                setTimeout(() => { navigate('/student/dashboard'); }, 3000);
            }
        } catch (e) {
            if (!showTerminationModal) navigate('/student/dashboard');
        }
    };

    const terminateExam = async () => {
        setShowTerminationModal(true);
        submitExamData(answersRef.current, true);
    };

    const handleSilentSecurityAlert = (title, msg, type = "SILENT_ALERT") => {
        setSecurityModalTitle(title);
        setSecurityModalMessage(msg);
        setShowSecurityModal(true);
        logViolation(type, msg);
    };

    const safeAlert = (title, msg) => {
        setSecurityModalTitle(title);
        setSecurityModalMessage(msg);
        setShowSecurityModal(true);
    };

    const handleSecurityViolation = useCallback(async (type, details = "") => {
        if (showTerminationModal || isSubmitting) return;

        // PRE-EXAM MODE: Alert but NO logging, No count increase
        if (!isExamStarted) {
            safeAlert("PRE-EXAM SECURITY CHECK", `${type} detected.\n\n${details}\n\nPlease resolve this issue (close VM or disconnect extra monitors) to proceed.`);
            return;
        }

        // ACTIVE EXAM MODE: Log violation and increase count
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        const logEntry = { type, details, time: new Date().toLocaleTimeString() };
        setViolationLogs(prev => [...prev, logEntry]);
        logViolation(type, details || `Count: ${newCount}`);

        if (newCount > MAX_WARNINGS) {
            terminateExam();
        } else {
            safeAlert(`MALPRACTICE WARNING (${newCount}/${MAX_WARNINGS + 1})`, `${type} detected!\n\n${details}\n\nFurther violations will lead to automatic submission.`);
        }
    }, [violationCount, showTerminationModal, isSubmitting, id, isExamStarted]);

    const checkDeviceIntegrity = useCallback(() => {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
                    const vmKeywords = ['virtualbox', 'vmware', 'vm-graphics', 'swiftshader', 'llvmpipe', 'parallel', 'qemu', 'google cloud'];
                    if (vmKeywords.some(key => renderer.includes(key))) {
                        handleSecurityViolation("VM_DETECTED");
                        return false;
                    }
                }
            }
            return true;
        } catch (e) { return true; }
    }, [handleSecurityViolation]);

    const checkScreenConfiguration = useCallback(async () => {
        try {
            // Priority 1: Modern Multi-Screen Window Management API
            if ('getScreenDetails' in window) {
                const details = await window.getScreenDetails();
                if (details.screens.length > 1) {
                    handleSecurityViolation("MULTI_MONITOR_DETECTED");
                    return false;
                }
            } 
            // Priority 2: Simple Screen Extended check (Chrome 100+)
            else if (window.screen.isExtended) {
                handleSecurityViolation("MULTI_MONITOR_DETECTED");
                return false;
            }
            // Priority 3: Geometry heuristic (Fallback)
            else if (window.screen.width > window.innerWidth * 1.5 && !window.screen.isExtended) {
                 // handleSecurityViolation("SCREEN_SPANNING_DETECTED");
            }
            return true;
        } catch (e) { return true; }
    }, [handleSecurityViolation]);

    // 3. CONTINUOUS SECURITY MONITORING & PROTECTION
    useEffect(() => {
        let screenDetails = null;
        let integrityInterval = setInterval(checkDeviceIntegrity, 10000); // Check VM every 10s

        // Anti-Screen-Capture Monkey-patch (Detects if student tries to use browser recording)
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
            navigator.mediaDevices.getDisplayMedia = function() {
                handleSilentSecurityAlert("SCREEN CAPTURE BLOCKED", "Browser-based screen recording or sharing is strictly prohibited.");
                return Promise.reject(new Error("Screen capture is disabled for security reasons."));
            };
        }

        const setupScreenMonitoring = async () => {
            if ('getScreenDetails' in window) {
                try {
                    screenDetails = await window.getScreenDetails();
                    screenDetails.onscreenchange = () => {
                        if (screenDetails.screens.length > 1) handleSecurityViolation("MULTI_MONITOR_DETECTED");
                    };
                } catch (e) { }
            }
        };
        setupScreenMonitoring();

        // Aggressive Focus Polling (Every 100ms) - CAUTION: Higher frequency to catch fast OS overlays
        const focusPollInterval = setInterval(() => {
            // Check all guards including modal states
            if (!isExamStarted || isSubmitting || showSuccessModal || showTerminationModal) return;
            
            const hasFocus = document.hasFocus();
            const isTabActive = !document.hidden;

            if ((!hasFocus || !isTabActive) && !isFocusLost) {
                setIsFocusLost(true);
                logViolation("AGGRESSIVE_FOCUS_LOSS_DETECTED", "Browser focus lost or tab dimmed.");
            } else if (hasFocus && isTabActive && isFocusLost) {
                setIsFocusLost(false);
            }
        }, 100);

        return () => {
            clearInterval(integrityInterval);
            clearInterval(focusPollInterval);
            if (screenDetails) screenDetails.onscreenchange = null;
        };
    }, [handleSecurityViolation, checkDeviceIntegrity, isExamStarted, isFocusLost, isSubmitting, showSuccessModal, showTerminationModal]);

    const requestFullScreen = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen()
                .then(() => {
                    setIsFullScreen(true);
                    setIsExamStarted(true);
                    
                    // SECURITY FIX: Persist start time in sessionStorage to survive page refreshes
                    const sessionKey = `startedAt_${id}`;
                    let startTime = sessionStorage.getItem(sessionKey);
                    if (!startTime) {
                        startTime = new Date().toISOString();
                        sessionStorage.setItem(sessionKey, startTime);
                    }
                    startedAtRef.current = startTime;
                })
                .catch(() => { });
        }
    };

    const enterFullScreen = async () => {
        const isDeviceSecure = checkDeviceIntegrity();
        const isScreenSecure = await checkScreenConfiguration();

        if (!isDeviceSecure || !isScreenSecure) return;
        requestFullScreen();
    };

    useEffect(() => {
        const handleBackButton = (event) => {
            event.preventDefault();
            if (!isExamStarted) {
                navigate('/student/dashboard');
                return;
            }
            safeAlert("INCOMPLETE ATTEMPT", "Navigating away triggers Auto-Submission.");
            submitExamData(answersRef.current);
        };
        window.history.pushState(null, null, window.location.href);
        window.addEventListener('popstate', handleBackButton);

        const handleVisibility = () => { if (document.hidden) handleSecurityViolation("TAB_SWITCH"); };

        const handleFS = () => {
            if (!document.fullscreenElement && !showTerminationModal) {
                setIsFullScreen(false);
                handleSecurityViolation("EXIT_FULL_SCREEN");
            } else {
                setIsFullScreen(true);
            }
        };

        const handleFocusBlur = () => {
            if (document.hidden || !document.hasFocus()) {
                setIsFocusLost(true);
                if (isExamStarted) {
                    logViolation("SCREENSHOT_RECOVERY_ATTEMPT", "Window lost focus - possible screenshot/recording software launch.");
                }
            } else {
                setIsFocusLost(false);
            }
        };

        const handlePointerLeave = () => {
            if (isExamStarted) {
                setIsFocusLost(true);
                logViolation("POINTER_EXIT_DETECTED", "Mouse left the window - possible OS screenshot tool selection.");
            }
        };

        const handleSelectionChange = () => {
            // Only clear if not in an input/textarea (to allow typing)
            const activeElement = document.activeElement;
            if (isExamStarted && activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
                window.getSelection().removeAllRanges();
            }
        };

        const handleClipboard = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSilentSecurityAlert("CLIPBOARD BLOCKED", "Copying or cutting content is strictly prohibited.");
            return false;
        };

        const handleKeyDown = (e) => {
            // Block PrintScreen (standard and mobile equivalent)
            if (e.key === 'PrintScreen' || e.keyCode === 44) {
                e.preventDefault();
                handleSilentSecurityAlert("SCREENSHOT BLOCKED", "Screen captures are strictly prohibited to maintain exam integrity.");
                return;
            }

            // Block Win+Shift+S, Ctrl+Shift+S (Screenshot Tools)
            if (e.shiftKey && (e.metaKey || e.ctrlKey) && (e.key === 'S' || e.key === 's')) {
                e.preventDefault();
                handleSilentSecurityAlert("SCREENSHOT SHORTCUT DETECTED", "Screenshot shortcuts like Win+Shift+S or Ctrl+Shift+S are prohibited.");
                return;
            }

            // Block Win+G (Game Bar / Recording)
            if (e.metaKey && (e.key === 'G' || e.key === 'g')) {
                e.preventDefault();
                handleSilentSecurityAlert("SCREEN RECORDER SHORTCUT", "Recording shortcuts like Win+G are strictly prohibited.");
                return;
            }

            // Block F12 (keyCode 123)
            if (e.keyCode === 123) {
                e.preventDefault();
                handleSecurityViolation("DEV_TOOLS_ATTEMPT");
                return;
            }

            // Block Ctrl+Shift+I (73), Ctrl+Shift+J (74), Ctrl+Shift+C (67)
            // Block Ctrl+U (85), Ctrl+S (83), Ctrl+P (80)
            if (e.ctrlKey && (
                (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
                (e.keyCode === 85 || e.keyCode === 83 || e.keyCode === 80)
            )) {
                e.preventDefault();
                handleSecurityViolation("DEV_TOOLS_ATTEMPT");
                return;
            }

            // Block Shift+F10 (Context Menu)
            if (e.shiftKey && e.keyCode === 121) {
                e.preventDefault();
                handleSecurityViolation("CONTEXT_MENU_ATTEMPT");
                return;
            }

            // Block Ctrl+V (Paste), Ctrl+C (Copy), Ctrl+X (Cut)
            // Note: We allow these in the Monaco editor if needed, 
            // but the global paste event will still be blocked.
            if (e.ctrlKey && (e.keyCode === 86 || e.keyCode === 67 || e.keyCode === 88)) {
                // If not in an input/textarea/editor, block it
                const isInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.closest('.monaco-editor');
                if (!isInput) {
                    e.preventDefault();
                    handleSecurityViolation("CLIPBOARD_ACTION");
                }
            }
        };

        const handlePaste = (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSecurityViolation("PASTE_ATTEMPT");
            alert("Pasting is strictly prohibited during the exam!");
        };

        const handleDrop = (e) => {
            e.preventDefault();
            handleSecurityViolation("DROP_ATTEMPT");
        };

        const handleContextMenu = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Use Capture Phase (true) to catch events before they reach children
        document.addEventListener('visibilitychange', handleVisibility);
        document.addEventListener('fullscreenchange', handleFS);
        window.addEventListener('blur', handleFocusBlur);
        window.addEventListener('focus', handleFocusBlur);
        document.addEventListener('pointerleave', handlePointerLeave);
        document.addEventListener('selectionchange', handleSelectionChange);
        document.addEventListener('copy', handleClipboard, true);
        document.addEventListener('cut', handleClipboard, true);
        document.addEventListener('contextmenu', handleContextMenu, true);
        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('paste', handlePaste, true);
        document.addEventListener('drop', handleDrop, true);

        return () => {
            window.removeEventListener('popstate', handleBackButton);
            document.removeEventListener('visibilitychange', handleVisibility);
            document.removeEventListener('fullscreenchange', handleFS);
            window.removeEventListener('blur', handleFocusBlur);
            window.removeEventListener('focus', handleFocusBlur);
            document.removeEventListener('pointerleave', handlePointerLeave);
            document.removeEventListener('selectionchange', handleSelectionChange);
            document.removeEventListener('copy', handleClipboard, true);
            document.removeEventListener('cut', handleClipboard, true);
            document.removeEventListener('contextmenu', handleContextMenu, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('paste', handlePaste, true);
            document.removeEventListener('drop', handleDrop, true);
        };
    }, [handleSecurityViolation, showTerminationModal, isExamStarted, isSubmitting, showSuccessModal]);


    // 3. EDITOR SYNC
    useEffect(() => {
        if (exam && exam.questions && exam.questions.length > 0 && exam.questions[currentQIndex]?.type === 'CODE') {
            const q = exam.questions[currentQIndex];
            const savedCode = answers[q._id];
            let lang = q.allowedLanguages?.[0] || 'java';
            setSelectedLanguage(lang);
            setTestResults(null);
            if (!savedCode) handleAnswerChange(getBoilerplate(lang), q._id);
        }
    }, [currentQIndex, exam]);

    const handleAnswerChange = (value, qId = null) => {
        if (!exam) return;
        const q = qId ? exam.questions.find(x => x._id === qId) : exam.questions[currentQIndex];
        const questionId = q?._id || qId;

        if (q?.type === 'MCQ') {
            const isMultiSelect = (q.correctAnswers?.length || 0) > 1;
            setAnswers(prev => {
                const current = prev[questionId] || [];
                const currentArr = Array.isArray(current) ? current : [current].filter(x => x);

                if (isMultiSelect) {
                    if (currentArr.includes(value)) {
                        return { ...prev, [questionId]: currentArr.filter(v => v !== value) };
                    } else {
                        return { ...prev, [questionId]: [...currentArr, value] };
                    }
                } else {
                    return { ...prev, [questionId]: [value] };
                }
            });
        } else {
            setAnswers(prev => ({ ...prev, [questionId]: value }));
        }
    };

    const handleLanguageSwitch = (newLang) => {
        setSelectedLanguage(newLang);
        handleAnswerChange(getBoilerplate(newLang), exam.questions[currentQIndex]._id);
    };

    const handleEditorDidMount = (editor, monaco) => {
        // Intercept Monaco's internal key handling
        editor.onKeyDown((e) => {
            // Ctrl+V or Cmd+V
            if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
                e.preventDefault();
                e.stopPropagation();
                handleSecurityViolation("PASTE_ATTEMPT");
                alert("Pasting is strictly prohibited in the editor!");
            }
            // F12 or other restricted keys
            if (e.keyCode === monaco.KeyCode.F12) {
                e.preventDefault();
                e.stopPropagation();
                handleSecurityViolation("DEV_TOOLS_ATTEMPT");
            }
        });

        // Block Paste Action specifically
        editor.addAction({
            id: 'block-paste',
            label: 'Paste is Prohibited',
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV],
            run: () => {
                handleSecurityViolation("PASTE_ATTEMPT");
                alert("Pasting is strictly prohibited!");
            }
        });
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setConsoleOpen(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await axios.post(`${API_BASE_URL}/api/student/execute`, {
                language: selectedLanguage,
                sourceCode: answers[exam.questions[currentQIndex]._id],
                questionId: exam.questions[currentQIndex]._id
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            setTestResults(res.data.results);
            setAllTestResults(prev => ({ ...prev, [exam.questions[currentQIndex]._id]: res.data.results }));
        } catch (e) { safeAlert("EXECUTION ERROR", "Code execution failed. Please try again."); }
        finally { setIsRunning(false); }
    };

    if (loading) return <div className="vh-100 bg-gradient-dark text-white d-flex align-items-center justify-content-center"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>;
    if (!exam || !exam.questions || exam.questions.length === 0) return <div className="vh-100 bg-gradient-dark text-white d-flex align-items-center justify-content-center"><h3>Exam Invalid or Logic Error</h3></div>;

    const currentQ = exam.questions[currentQIndex];
    const isCoding = currentQ.type === 'CODE';

    // --- RENDER MODALS ---
    if (showTerminationModal) return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex flex-column align-items-center justify-content-center text-center p-5 px-3 z-3 backdrop-blur animate-fade-in" data-bs-theme="dark">
            <div className="glass-panel p-5 rounded-4 border-danger border-opacity-50 shadow-lg glow-danger animate-slide-up" style={{ maxWidth: '600px' }}>
                <div className="mb-4 d-inline-block p-4 rounded-circle bg-danger bg-opacity-10 shadow-sm border border-danger border-opacity-20 animate-pulse">
                    <AlertOctagon size={80} className="text-danger" />
                </div>
                <h1 className="display-5 fw-bold text-white mb-3">Exam Terminated</h1>
                <p className="lead text-white-50 mb-4" >
                    Multiple security violations were detected. Your exam has been automatically submitted and flagged for review by the administrator.
                </p>
                <div className="d-flex flex-column gap-3">
                    <div className="p-3 rounded bg-white bg-opacity-5 border border-white border-opacity-10 text-start small">
                        <div className="text-secondary text-uppercase fw-bold mb-2" style={{ fontSize: '0.65rem' }}>Security Log Summary</div>
                        <div className="d-flex flex-column gap-2 max-vh-25 overflow-auto custom-scrollbar pe-2">
                            {violationLogs.length > 0 ? violationLogs.map((log, i) => (
                                <div key={i} className="d-flex justify-content-between align-items-center border-bottom border-white border-opacity-5 pb-1 last-border-0">
                                    <span className="text-danger-emphasis fw-semibold" style={{ fontSize: '0.75rem' }}>{log.type.replace(/_/g, ' ')}</span>
                                    <span className="text-white-50" style={{ fontSize: '0.65rem' }}>{log.time}</span>
                                </div>
                            )) : (
                                <div className="text-white opacity-75">Flagged for suspicious activity (Tab switch/Fullscreen exit).</div>
                            )}
                        </div>
                    </div>
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-secondary px-4 py-2 btn-hover-scale fw-bold">Return to Dashboard</button>
                </div>
            </div>
        </div>
    );

    if (showSuccessModal) return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex flex-column align-items-center justify-content-center text-center p-5 px-3 z-3 backdrop-blur animate-fade-in" data-bs-theme="dark">
            <div className="glass-panel p-5 rounded-4 border-success border-opacity-50 shadow-lg glow-success animate-slide-up" style={{ maxWidth: '600px' }}>
                <div className="mb-4 d-inline-block p-4 rounded-circle bg-success bg-opacity-10 shadow-sm border border-success border-opacity-20">
                    <CheckCircle size={80} className="text-success animate-fade-in" />
                </div>
                <h1 className="display-5 fw-bold text-white mb-3">Exam Submitted!</h1>
                <p className="lead text-white-50 mb-4" >
                    Your response has been successfully recorded. You will be redirected to the dashboard shortly.
                </p>
                <button onClick={() => navigate('/student/dashboard')} className="btn btn-success px-5 py-2 btn-hover-scale fw-bold">Great, Thanks!</button>
            </div>
        </div>
    );

    if (showSecurityModal) return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-black bg-opacity-75 d-flex flex-column align-items-center justify-content-center text-center p-5 px-3 z-3 backdrop-blur animate-fade-in" data-bs-theme="dark">
            <div className="glass-panel p-5 rounded-4 border-danger border-opacity-50 shadow-lg glow-danger animate-slide-up" style={{ maxWidth: '600px' }}>
                <div className="mb-4 d-inline-block p-4 rounded-circle bg-danger bg-opacity-10 shadow-sm border border-danger border-opacity-20">
                    <Shield size={80} className="text-danger animate-fade-in" />
                </div>
                <h1 className="display-6 fw-bold text-white mb-2">{securityModalTitle}</h1>
                <p className="text-white-50 mb-4 fs-5" style={{ whiteSpace: 'pre-wrap' }}>
                    {securityModalMessage}
                </p>
                <button 
                    onClick={() => {
                        setShowSecurityModal(false);
                        if (isExamStarted) enterFullScreen();
                    }} 
                    className="btn btn-danger px-5 py-2 btn-hover-scale fw-bold shadow-lg"
                >
                    I Understand & Re-enter Exam
                </button>
            </div>
        </div>
    );

    if (!isFullScreen) return (
        <div className="position-fixed top-0 start-0 w-100 h-100 bg-gradient-dark d-flex flex-column align-items-center justify-content-center text-white text-center p-4 z-3 animate-fade-in" data-bs-theme="dark">
            <div className="card glass-panel border-danger border-opacity-25 shadow-lg w-100 animate-slide-up" style={{ maxWidth: '500px' }}>
                <div className="card-body p-5">
                    <ShieldAlert size={64} className="mb-4 text-danger d-block mx-auto" />
                    <h2 className="h4 fw-bold mb-3 text-white">Secure Environment Required</h2>
                    <p className="text-white-50 mb-4 small">
                        GuardXLens requires full-screen mode to ensure exam integrity. Exiting full-screen is recorded as a violation.
                    </p>
                    <button onClick={enterFullScreen} className="btn btn-danger w-100 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg btn-hover-scale">
                        <Maximize2 size={18} /> Enter Secure Mode
                    </button>
                </div>
            </div>
        </div>
    );

    // --- MAIN EXAM UI ---
    return (
        <div className={`vh-100 d-flex flex-column bg-gradient-dark font-sans overflow-hidden text-light animate-fade-in ${isFocusLost ? 'screenshot-protected' : ''}`} data-bs-theme="dark" style={{ background: 'radial-gradient(circle at top right, #1e293b, #0f172a)', userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
            {/* Security Watermark */}
            <div className="security-watermark"></div>

            {/* Focus Loss Overlay */}
            {isFocusLost && (
                <div className="focus-blur-overlay">
                    <div className="glass-panel p-5 rounded-4 border-warning border-opacity-50 shadow-lg animate-pulse">
                        <Shield size={64} className="text-warning mb-4 mx-auto d-block" />
                        <h2 className="text-white fw-bold mb-3">Screen Content Protected</h2>
                        <p className="text-white-50 mb-4">
                            Content is hidden while the browser window is out of focus to prevent unauthorized screen captures or recording.
                        </p>
                        <p className="text-warning small fw-bold">Return to the browser window to continue.</p>
                    </div>
                </div>
            )}

            {/* 1. TOP NAVBAR */}
            <nav className="navbar navbar-expand navbar-dark glass-navbar px-3 py-2 flex-shrink-0">
                <div className="container-fluid">
                    <div className="d-flex align-items-center gap-3">
                        <div className="p-2 rounded bg-primary bg-gradient text-white shadow-sm">
                            <Lock size={18} />
                        </div>
                        <div className="d-none d-md-block">
                            <h6 className="mb-0 text-white fw-bold">{exam.title}</h6>
                            <span className={`badge ${exam.cameraMonitoring ? 'bg-info-subtle text-info border-info' : 'bg-warning-subtle text-warning border-warning'} border border-opacity-25`} style={{ fontSize: '0.65rem' }}>
                                {exam.cameraMonitoring ? 'AI PROCTORING ACTIVE' : 'STANDARD SECURITY ACTIVE'}
                            </span>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Timer */}
                        <div className={`d-flex align-items-center gap-2 px-3 py-1 rounded border transition-all ${timeLeft < 300 ? 'bg-danger bg-opacity-10 border-danger text-danger' : 'bg-white bg-opacity-10 border-white border-opacity-10 text-light'}`}>
                            <Clock size={16} className={timeLeft < 300 ? 'animate-pulse' : ''} />
                            <span className="fw-mono fw-bold fs-5">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <button onClick={() => submitExamData(answers)} className="btn btn-danger btn-sm fw-bold px-3 shadow-sm btn-hover-scale">Finish Exam</button>
                    </div>
                </div>
            </nav>

            {/* 2. MAIN CONTENT AREA */}
            <div className="flex-grow-1 d-flex overflow-hidden">

                {/* QUESTION PALETTE (Mobile Offcanvas / Desktop Sidebar) */}
                <div className={`d-flex flex-column glass-panel border-end border-white border-opacity-10 animate-fade-in ${showQuestionPalette ? 'd-flex' : isCoding ? 'd-none' : 'd-none d-md-flex'}`} style={{ width: '260px', transition: 'width 0.3s' }}>
                    <div className="p-3 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-white-50 text-uppercase small">Questions</span>
                        <div className="cursor-pointer text-white-50 hover-text-white transition-colors" onClick={() => setShowQuestionPalette(false)}><X size={18} /></div>
                    </div>
                    <div className="flex-grow-1 overflow-auto p-2 custom-scrollbar">
                        <div className="row g-2">
                            {exam.questions.map((_, i) => (
                                <div key={i} className="col-3">
                                    <button
                                        onClick={() => { setCurrentQIndex(i); setShowQuestionPalette(false); }}
                                        className={`btn w-100 p-0 d-flex align-items-center justify-content-center border transition-all ${currentQIndex === i ? 'btn-primary text-white shadow-sm' : answers[exam.questions[i]._id] ? 'btn-success text-white shadow-sm' : 'btn-dark bg-opacity-50 text-secondary border-secondary border-opacity-25'}`}
                                        style={{ height: '40px', fontSize: '0.9rem' }}
                                    >
                                        {i + 1}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-3 border-top border-white border-opacity-10 bg-transparent small text-white-50">
                        <div className="d-flex justify-content-between mb-1"><span>Total</span> <span>{exam.questions.length}</span></div>
                        <div className="d-flex justify-content-between mb-1"><span className="text-success">Answered</span> <span>{Object.keys(answers).length}</span></div>
                    </div>
                </div>

                {/* ACTIVE QUESTION PANEL */}
                <div className="flex-grow-1 d-flex flex-column flex-md-row overflow-hidden bg-transparent">

                    {/* LEFT PANEL: Question Text & Options */}
                    <div className={`d-flex flex-column overflow-auto p-4 custom-scrollbar ${isCoding ? 'col-md-5 border-end border-white border-opacity-10' : 'col-12 col-lg-8 mx-auto'}`}>
                        {/* Mobile Toggle for Palette */}
                        <button className={`btn btn-outline-light border-opacity-25 mb-3 w-100 ${isCoding ? '' : 'd-md-none'}`} onClick={() => setShowQuestionPalette(true)}>
                            <Menu size={16} className="me-2" /> View Question Map
                        </button>

                        <div className="d-flex justify-content-between align-items-start mb-3 animate-slide-up stagger-1">
                            <div>
                                <h4 className="fw-bold mb-1 text-white">Question {currentQIndex + 1}</h4>
                                <span className={`badge ${currentQ.type === 'CODE' ? 'bg-primary' : 'bg-info'} bg-opacity-75 me-2`}>{currentQ.type}</span>
                                <span className="badge bg-secondary bg-opacity-50">{currentQ.marks} Marks</span>
                            </div>
                        </div>

                        <div className="mb-4 animate-slide-up stagger-2">
                            <p className="lead fs-6 text-light opacity-90" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{currentQ.questionText}</p>
                        </div>

                        {/* INPUTS */}
                        {currentQ.type === 'MCQ' && (
                            <div className="d-flex flex-column gap-2 mb-4 animate-slide-up stagger-3">
                                <div className="text-white-50 small mb-1 uppercase tracking-wider font-bold" style={{ fontSize: '0.7rem' }}>
                                    {(currentQ.correctAnswers?.length || 0) > 1 ? "Multiple Select" : "Single Choice"}
                                </div>
                                {currentQ.options.map((opt, i) => {
                                    const studentAnswers = answers[currentQ._id] || [];
                                    const isSelected = Array.isArray(studentAnswers) ? studentAnswers.includes(opt) : studentAnswers === opt;
                                    const isMulti = (currentQ.correctAnswers?.length || 0) > 1;

                                    return (
                                        <div
                                            key={i}
                                            onClick={() => handleAnswerChange(opt)}
                                            className={`p-3 rounded-3 border d-flex align-items-center gap-3 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'glass-panel border-white border-opacity-10 hover-bg-light-10'}`}
                                        >
                                            <div className={`${isMulti ? 'rounded' : 'rounded-circle'} border d-flex align-items-center justify-content-center flex-shrink-0 transition-all ${isSelected ? 'border-primary bg-primary' : 'border-secondary'}`} style={{ width: '22px', height: '22px' }}>
                                                {isSelected && (isMulti ? <CheckCircle size={14} className="text-black" /> : <div className="bg-black rounded-circle" style={{ width: '8px', height: '8px' }}></div>)}
                                            </div>
                                            <span className={isSelected ? 'text-white fw-bold' : 'text-light opacity-75'}>{opt}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {currentQ.type === 'SHORT' && (
                            <div className="mb-4 animate-slide-up stagger-3">
                                <textarea
                                    className="form-control bg-dark text-light border-secondary border-opacity-50 focus-ring-primary"
                                    rows="10"
                                    placeholder="Type your answer here..."
                                    value={answers[currentQ._id] || ''}
                                    onChange={(e) => handleAnswerChange(e.target.value)}
                                    style={{ resize: 'none' }}
                                ></textarea>
                            </div>
                        )}

                        {/* BUTTONS for Mobile (Bottom sticking in this view or normally flowed) */}
                        <div className="mt-auto pt-4 d-flex justify-content-between">
                            <button
                                onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}
                                disabled={currentQIndex === 0}
                                className="btn btn-outline-light border-opacity-25 d-flex align-items-center gap-2 hover-bg-light-10 btn-hover-scale"
                            >
                                <ChevronLeft size={16} /> Prev
                            </button>
                            <button
                                onClick={() => setCurrentQIndex(Math.min(exam.questions.length - 1, currentQIndex + 1))}
                                disabled={currentQIndex === exam.questions.length - 1}
                                className="btn btn-primary d-flex align-items-center gap-2 shadow-lg btn-hover-scale"
                            >
                                Next <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT PANEL: Coding Editor (If Code) */}
                    {isCoding && (
                        <div className="col-md-7 d-flex flex-column h-100 bg-black text-white p-0 border-start border-white border-opacity-10">
                            {/* Toolbar */}
                            <div className="p-2 border-bottom border-white border-opacity-10 d-flex justify-content-between align-items-center glass-panel">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => handleLanguageSwitch(e.target.value)}
                                    className="form-select form-select-sm bg-dark text-white border-secondary border-opacity-50"
                                    style={{ width: 'auto' }}
                                >
                                    {[...new Set(currentQ.allowedLanguages || [])].map(l => (
                                        <option key={l} value={l}>{l.toUpperCase()}</option>
                                    ))}
                                </select>
                                <button onClick={handleRunCode} disabled={isRunning} className="btn btn-success btn-sm d-flex align-items-center gap-2 shadow-sm btn-hover-scale">
                                    <Play size={14} /> Run Code
                                </button>
                            </div>

                            {/* Editor */}
                            <div className="flex-grow-1">
                                <Editor
                                    height="100%"
                                    theme="vs-dark"
                                    language={selectedLanguage === 'c' ? 'cpp' : selectedLanguage}
                                    value={answers[currentQ._id] || ""}
                                    onChange={(val) => handleAnswerChange(val)}
                                    onMount={handleEditorDidMount}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        scrollBeyondLastLine: false,
                                        contextmenu: false, // Disable editor context menu
                                        pasteAsHtml: false
                                    }}
                                    loading={<div className="text-secondary p-3">Loading Editor...</div>}
                                />
                            </div>

                            {/* Console */}
                            {consoleOpen && (
                                <div className="border-top border-white border-opacity-10 bg-black d-flex flex-column" style={{ height: '30%' }}>
                                    <div className="p-1 px-3 border-bottom border-white border-opacity-10 bg-dark bg-opacity-50 text-secondary small fw-bold text-uppercase d-flex justify-content-between align-items-center">
                                        <span><Terminal size={12} className="me-2" /> Console</span>
                                        <span onClick={() => setConsoleOpen(false)} className="cursor-pointer hover-text-white"><X size={12} /></span>
                                    </div>
                                    <div className="p-3 font-monospace small overflow-auto text-light flex-grow-1 custom-scrollbar">
                                        {!testResults ? (
                                            <div className="text-secondary opacity-50 text-center mt-3">Ready to execute...</div>
                                        ) : (
                                            testResults.map((r, i) => (
                                                <div key={i} className={`mb-2 p-2 rounded border ${r.status === 'Passed' ? 'border-success bg-success bg-opacity-10' : 'border-danger bg-danger bg-opacity-10'}`}>
                                                    <div className="d-flex justify-content-between fw-bold mb-1">
                                                        <span className={r.status === 'Passed' ? 'text-success' : 'text-danger'}>Case {i + 1}: {r.status}</span>
                                                    </div>
                                                    {r.status !== 'Passed' && (
                                                        <div className="ps-2 border-start border-danger">
                                                            <div className="text-secondary">Expected: <span className="text-white opacity-75">{r.expected}</span></div>
                                                            <div className="text-secondary">Actual: <span className="text-danger opacity-75">{r.actual}</span></div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                            {!consoleOpen && <div className="bg-black p-1 text-center border-top border-white border-opacity-10 cursor-pointer hover-bg-light-10" onClick={() => setConsoleOpen(true)}><Terminal size={12} className="text-secondary" /></div>}
                        </div>
                    )}

                </div>
            </div>

            {/* AI Proctoring Component */}
            {exam.cameraMonitoring && <WebcamProctor onViolation={handleSecurityViolation} />}
        </div>
    );
};

export default TakeExam;
