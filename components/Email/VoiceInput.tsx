import { useState, useRef, useEffect } from 'react';
import { IconMicrophone, IconMicrophoneOff, IconAlertCircle } from '@tabler/icons-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
}

const VoiceInput = ({ onTranscript, isRecording, onRecordingChange }: VoiceInputProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            finalTranscriptRef.current = finalTranscript;
            onTranscript(finalTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'not-allowed') {
            setError('Microphone access denied. Please allow microphone access in your browser settings.');
          } else if (event.error === 'no-speech') {
            setError('No speech detected. Please try speaking again.');
          } else if (event.error === 'audio-capture') {
            setError('No microphone found. Please check your microphone connection.');
          } else {
            setError(`Error: ${event.error}`);
          }
          onRecordingChange(false);
        };

        recognitionRef.current.onend = () => {
          onRecordingChange(false);
          if (isRecording) {
            recognitionRef.current.start();
          }
        };
      } else {
        setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
  }, [onTranscript, onRecordingChange, isRecording]);

  const requestMicrophonePermission = async () => {
    try {
      setIsRequestingPermission(true);
      setError(null);
      
      // First, try to get the current permission state
      const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      if (permissionStatus.state === 'denied') {
        setError('Microphone access is blocked. Please enable it in Chrome settings: chrome://settings/content/microphone');
        return false;
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
      });
      
      // Stop all tracks after getting permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please check your microphone connection.');
      } else {
        setError('Failed to access microphone. Please check your browser settings.');
      }
      return false;
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const toggleRecording = async () => {
    if (!recognitionRef.current) return;

    try {
      if (isRecording) {
        recognitionRef.current.stop();
        onRecordingChange(false);
      } else {
        const hasPermission = await requestMicrophonePermission();
        if (hasPermission) {
          finalTranscriptRef.current = '';
          recognitionRef.current.start();
          onRecordingChange(true);
        }
      }
    } catch (err: any) {
      console.error('Recording error:', err);
      setError('Failed to start recording. Please try again.');
      onRecordingChange(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleRecording}
        disabled={isRequestingPermission}
        className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : isRequestingPermission
            ? 'bg-gray-500 cursor-wait'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
      >
        {isRecording ? (
          <IconMicrophoneOff size={24} />
        ) : isRequestingPermission ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <IconMicrophone size={24} />
        )}
      </button>
      {error && (
        <div className="text-red-500 text-sm mt-2 bg-red-100/10 p-2 rounded-lg max-w-[250px] text-center flex items-center gap-2">
          <IconAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      {isRecording && (
        <div className="text-sm text-blue-400 animate-pulse bg-blue-500/10 px-3 py-1 rounded-full">
          Recording...
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 