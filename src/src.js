import { FFmpeg } from '@ffmpeg/ffmpeg';

const $ = id => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('file');
const workspace = $('workspace');
const audio = $('audio');
const status = $('status');
const convert = $('convert');
const format = $('format');
let selectedFile = null;
let audioURL = null;
let coverURL = null;
let ffmpeg = null;
let loading = null;

function openPicker() { fileInput.click(); }
dropzone.addEventListener('click', openPicker);
dropzone.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPicker(); }
});
dropzone.addEventListener('dragover', event => event.preventDefault());
dropzone.addEventListener('drop', event => {
  event.preventDefault();
  if (event.dataTransfer.files[0]) selectFile(event.dataTransfer.files[0]);
});
$('replace').addEventListener('click', openPicker);
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) selectFile(fileInput.files[0]);
  fileInput.value = '';
});

function selectFile(file) {
  if (!/\.(mp3|wav|flac|aac|ogg|m4a|opus|aiff?)$/i.test(file.name)) {
    alert('Please select a supported audio file.');
    return;
  }
  selectedFile = file;
  audio.pause();
  if (audioURL) URL.revokeObjectURL(audioURL);
  audioURL = URL.createObjectURL(file);
  audio.src = audioURL;
  $('play').textContent = '▶';
  $('filename').textContent = file.name;
  status.textContent = '';
  format.value = /\.mp3$/i.test(file.name) ? 'wav' : 'mp3';
  dropzone.hidden = true;
  workspace.hidden = false;
  showCover(file);
}

function showCover(file) {
  const image = $('cover');
  image.style.display = 'none';
  $('placeholder').hidden = false;
  if (coverURL) URL.revokeObjectURL(coverURL);
  coverURL = null;
  if (!window.jsmediatags) return;
  window.jsmediatags.read(file, {
    onSuccess: ({ tags }) => {
      if (selectedFile !== file || !tags?.picture?.data) return;
      coverURL = URL.createObjectURL(new Blob([Uint8Array.from(tags.picture.data)], { type: tags.picture.format || 'image/jpeg' }));
      image.onload = () => { if (selectedFile === file) { image.style.display = 'block'; $('placeholder').hidden = true; } };
      image.src = coverURL;
    }, onError: () => {}
  });
}

$('play').addEventListener('click', async () => {
  if (audio.paused) {
    try { await audio.play(); $('play').textContent = 'Ⅱ'; }
    catch { status.textContent = 'This audio format cannot be previewed in your browser.'; }
  } else { audio.pause(); $('play').textContent = '▶'; }
});
audio.addEventListener('ended', () => $('play').textContent = '▶');

async function loadEngine() {
  if (ffmpeg) return ffmpeg;
  if (loading) return loading;
  loading = (async () => {
    status.textContent = 'Starting audio engine (first load downloads ~31 MB)...';
    const instance = new FFmpeg();
    instance.on('log', ({ message }) => console.debug('FFmpeg:', message));
    try {
      await Promise.race([
        instance.load({
          coreURL: new URL('ffmpeg-core/ffmpeg-core.js', document.baseURI).href,
          wasmURL: new URL('ffmpeg-core/ffmpeg-core.wasm', document.baseURI).href
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('The audio engine could not start. Check browser console and hosting settings.')), 90000))
      ]);
      ffmpeg = instance;
      return instance;
    } catch (error) {
      instance.terminate();
      throw error;
    }
  })();
  try { return await loading; }
  finally { loading = null; }
}

const codecs = {
  mp3: ['-c:a', 'libmp3lame', '-b:a', '192k'],
  wav: ['-c:a', 'pcm_s16le'],
  flac: ['-c:a', 'flac'],
  aac: ['-c:a', 'aac', '-b:a', '192k', '-f', 'adts'],
  ogg: ['-c:a', 'libvorbis', '-q:a', '5']
};

convert.addEventListener('click', async () => {
  if (!selectedFile) return;
  convert.disabled = true;
  format.disabled = true;
  const file = selectedFile;
  const target = format.value;
  const extension = file.name.split('.').pop().toLowerCase();
  const inputName = `beatelo-input.${extension}`;
  const outputName = `beatelo-output.${target}`;
  try {
    const instance = await loadEngine();
    status.textContent = 'Converting audio...';
    await instance.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
    const code = await instance.exec(['-y', '-i', inputName, '-vn', ...codecs[target], outputName], 180000);
    if (code !== 0) throw new Error('Conversion failed or timed out for this format.');
    const data = await instance.readFile(outputName);
    const mime = { mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac', ogg: 'audio/ogg' }[target];
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name.replace(/\.[^.]+$/, '') + '.' + target;
    document.body.appendChild(link);
    link.click();
    link.remove();
    status.textContent = 'Conversion complete! Download started.';
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    await instance.deleteFile(inputName);
    await instance.deleteFile(outputName);
  } catch (error) {
    console.error('Beatelo audio converter:', error);
    status.textContent = 'Conversion error: ' + (error.message || String(error));
    if (ffmpeg) { ffmpeg.terminate(); ffmpeg = null; }
  } finally {
    convert.disabled = false;
    format.disabled = false;
  }
});
