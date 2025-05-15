import { pipeline, TextStreamer } from '@huggingface/transformers';

class MyTranslationPipeline {
  static task = 'translation';
  static model = 'Xenova/nllb-200-distilled-600M';
  static instance = null;

  // Load or return the existing pipeline instance
  static async getInstance(progress_callback = null) {
    if (!this.instance) {
      this.instance = await pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  const { text, src_lang, tgt_lang } = event.data;

  // Load pipeline (with progress updates)
  const translator = await MyTranslationPipeline.getInstance((progress) => {
    self.postMessage({ status: 'loading', progress });
  });

  // Set up the text streamer to stream back output tokens
  const streamer = new TextStreamer(translator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text) => {
      self.postMessage({
        status: 'update',
        output: text
      });
    }
  });

  // Perform translation
  const output = await translator(text, {
    src_lang,
    tgt_lang,
    streamer
  });

  // Send final result
  self.postMessage({
    status: 'complete',
    output
  });
});
