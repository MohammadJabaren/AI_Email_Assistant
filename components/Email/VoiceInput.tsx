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
          setError(`Error: ${event.error}`);
          onRecordingChange(false);
        };

        recognitionRef.current.onend = () => {
          onRecordingChange(false);
        };
      } else {
        setError('Speech recognition is not supported in your browser.');
      }
    }
  }, [onTranscript, onRecordingChange]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setError(null);
      recognitionRef.current.start();
    }
    onRecordingChange(!isRecording);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={toggleRecording}
        className={`p-3 rounded-full transition-all duration-200 ${
          isRecording
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? (
          <IconMicrophoneOff size={24} />
        ) : (
          <IconMicrophone size={24} />
        )}
      </button>
      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
      {isRecording && (
        <div className="text-sm text-gray-500 animate-pulse">
          Recording...
        </div>
      )}
    </div>
  );
};

export default VoiceInput; 