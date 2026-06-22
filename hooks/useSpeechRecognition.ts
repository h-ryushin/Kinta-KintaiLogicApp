import { useRef, useState } from 'react';

// 外から「スタッフ一覧を更新する関数」をもらうようにする
interface UseSpeechRecognitionProps {
    setStaffList: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useSpeechRecognition({ setStaffList }: UseSpeechRecognitionProps) {

    // ②【こもって作業する】中で使うロジックやState、Ref
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const recognitionRef = useRef<any>(null);
    // const [isListening, setIsListening] = useState(false);
    const [listeningStaffId, setListeningStaffId] = useState<string | null>(null);
    const startListening = (staffId: string) => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'ja-JP';
        recognition.continuous = true;
        recognition.interimResults = true;

        const resetTimer = () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(() => { recognition.stop(); }, 3500);
        };
        // recognition.onstart = () => { onStart(); resetTimer(); };
        // recognition.onstart = () => {
        //     setIsListening(true);
        //     resetTimer();
        // };
        recognition.onstart = () => {
            setListeningStaffId(staffId);
            resetTimer();
        };
        recognition.onresult = (event: any) => {
            resetTimer();
            const lastIndex = event.results.length - 1;
            const result = event.results[lastIndex];
            if (result.isFinal) {
                const text = result[0].transcript
                    .replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                    .replace(/[ァ-ン]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0x60));

                const extractTime = (sentence: string, keywords: string[]) => {
                    for (const word of keywords) {
                        if (sentence.includes(word)) {
                            const part = sentence.split(word)[0];
                            const timeMatch = part.match(/(\d{1,2})時(?:(\d{1,2})分|(半))?$/) || part.match(/(\d{1,2}):(\d{1,2})$/);
                            if (timeMatch) {
                                const h = timeMatch[1].padStart(2, '0');
                                let m = timeMatch[2] ? timeMatch[2].padStart(2, '0') : (timeMatch[3] === "半" ? "30" : "00");
                                return `${h}:${m}`;
                            }
                        }
                    }
                    return null;
                };
                const start = extractTime(text, ["入り", "から", "スタート", "はじめ"]);
                const end = extractTime(text, ["上がり", "まで", "おわり", "だし"]);
                if (start || end) {
                    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, startTime: start || s.startTime, endTime: end || s.endTime } : s));
                }
            }
        };
        // recognition.onend = () => { onEnd(); if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
        // recognition.onend = () => {
        //     setIsListening(false);
        //     if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        // };
        // recognition.start();
        recognition.onend = () => {
            setListeningStaffId(null);
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };

        recognition.start();
    };

    // ③【出荷する】画面側に返してあげるリモコン
    return { startListening, listeningStaffId };
}