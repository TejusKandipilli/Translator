import { useEffect, useRef, useState } from 'react';
import LanguageSelector from './components/LanguageSelector';
import Progress from './components/Progress';

function App() {
  const [ready, setReady] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [progressItems, setProgressItems] = useState([]);

  // Inputs and outputs
  const [input, setInput] = useState('I love walking my dog.');
  const [sourceLanguage, setSourceLanguage] = useState('eng_Latn');
  const [targetLanguage, setTargetLanguage] = useState('fra_Latn');
  const [output, setOutput] = useState('');

  // Create a reference to the worker object.
  const worker = useRef(null);

  // Message handler for worker messages
  const onMessageReceived = (e) => {
    switch (e.data.status) {
      case 'initiate':
        // Model file start load: add a new progress item to the list.
        setReady(false);
        setProgressItems(prev => [...prev, e.data]);
        break;

      case 'progress':
        // Model file progress: update one of the progress items.
        setProgressItems(prev =>
          prev.map(item => (item.file === e.data.file ? { ...item, progress: e.data.progress } : item))
        );
        break;

      case 'done':
        // Model file loaded: remove the progress item from the list.
        setProgressItems(prev => prev.filter(item => item.file !== e.data.file));
        break;

      case 'ready':
        // Pipeline ready: the worker is ready to accept messages.
        setReady(true);
        break;

      case 'update':
        // Generation update: update the output text.
        setOutput(o => o + e.data.output);
        break;

      case 'complete':
        // Generation complete: re-enable the "Translate" button
        setDisabled(false);
        break;

      default:
        break;
    }
  };

  // Setup worker and event listener once on mount
  useEffect(() => {
    // Initialize worker if not already created
    if (!worker.current) {
      worker.current = new Worker(new URL('./Worker.js', import.meta.url), { type: 'module' });
    }

    // Attach message handler
    worker.current.addEventListener('message', onMessageReceived);

    // Cleanup listener on unmount
    return () => {
      worker.current?.removeEventListener('message', onMessageReceived);
    };
  }, []);

  // Trigger translation
  const translate = () => {
    setDisabled(true);
    setOutput('');
    worker.current.postMessage({
      text: input,
      src_lang: sourceLanguage,
      tgt_lang: targetLanguage,
    });
  };

  return (
    <>
      <h1 className="text-4xl font-bold text-center text-blue-700 mt-8">Translator</h1>
      <h2 className="text-xl text-center text-gray-600 mb-6">Select from around 200 languages</h2>

      <div className="max-w-3xl mx-auto p-4 bg-white shadow-md rounded-2xl space-y-6">
        {/* Language Selectors */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <LanguageSelector
            type="Source"
            defaultLanguage="eng_Latn"
            onChange={x => setSourceLanguage(x.target.value)}
          />
          <LanguageSelector
            type="Target"
            defaultLanguage="fra_Latn"
            onChange={x => setTargetLanguage(x.target.value)}
          />
        </div>

        {/* Textboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <textarea
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={input}
            rows={4}
            placeholder="Enter text here..."
            onChange={e => setInput(e.target.value)}
          />
          <textarea
            className="w-full p-3 border border-gray-300 rounded-xl shadow-sm bg-gray-50 text-gray-600"
            value={output}
            rows={4}
            readOnly
          />
        </div>

        {/* Translate Button */}
        <div className="text-center">
          <button
            disabled={disabled}
            onClick={translate}
            className={`px-6 py-2 rounded-xl font-semibold text-white shadow-md transition-all duration-300 ${
              disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Translate
          </button>
        </div>

        {/* Progress Loader */}
    <div className='progress-bars-container'>
      {ready === false && (
        <label className='font-black'>Loading models... (only run once)</label>
      )}
      {progressItems.map(data => (
        <div key={data.file}>
          <Progress className='font-black' text={data.file} percentage={data.progress} />
        </div>
      ))}
    </div>
      </div>
    </>
  );
}

export default App;
