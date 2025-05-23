import { useState, useRef, useEffect } from 'react';
import { IconMicrophone, IconMicrophoneOff } from '@tabler/icons-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isRecording: boolean;
  onRecordingChange: (isRecording: boolean) => void;
}

const VoiceInput = ({ onTranscript, isRecording, onRecordingChange }: VoiceInputProps) => {
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          onTranscript(transcript);
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
        };
      } else {
        setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      }
    }
  }, [onTranscript, onRecordingChange]);

  const toggleRecording = async () => {
    if (!recognitionRef.current) return;

    try {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        // Request microphone permission explicitly
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the stream after getting permission
        
        setError(null);
        recognitionRef.current.start();
      }
      onRecordingChange(!isRecording);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Failed to access microphone. Please check your browser settings.');
      }
      onRecordingChange(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleRecording}
        className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white hover:scale-110 active:scale-95`}
        title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
      >
        {isRecording ? (
          <IconMicrophoneOff size={24} />
        ) : (
          <IconMicrophone size={24} />
        )}
      </button>
      {error && (
        <div className="text-red-500 text-sm mt-2 bg-red-100/10 p-2 rounded-lg max-w-[200px] text-center">
          {error}
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