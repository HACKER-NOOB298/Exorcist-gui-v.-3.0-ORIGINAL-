// --- SISTEMA DE ÁUDIO MAGNA V3.0 (COM SUPORTE A BACKGROUND/CALLS) ---
let playerMusica = new Audio();
let synth = window.speechSynthesis;
let utteranceAtual = null;
let vozes = [];

// Variáveis de Estado
let modoAtual = null; // 'mp3' ou 'tts'
let textoAtual = "";
let arquivoAtual = "";
let loopsTotais = 1;
let loopsExecutados = 0;
let isPausado = false; // Controle manual do usuário
let watcherInterval = null; // O "Vigia" que força o áudio

// --- INICIALIZAÇÃO ---
window.onload = () => { 
    carregarVozes(); 
    const salvo = localStorage.getItem('tema_preferido');
    if(salvo) mudarTema(salvo);

    // Configuração para Mobile (iOS/Android) não bloquear o som
    playerMusica.setAttribute('playsinline', 'true');
    playerMusica.setAttribute('webkit-playsinline', 'true');
    playerMusica.preload = 'auto';
};

synth.onvoiceschanged = carregarVozes;

function carregarVozes() { vozes = synth.getVoices(); }

function toggleMenu() { document.getElementById('sidebar').classList.toggle('closed'); }

// --- NAVEGAÇÃO ---
function navegar(idTela) {
    controlarAudio('stop');
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(idTela).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        if(b.getAttribute('onclick').includes(idTela)) b.classList.add('active');
    });

    if(idTela === 'dicionario') renderizarDicionario(dicionarioDB);
}

// --- CONTROLE DE TEMA ---
function mudarTema(tema) {
    document.body.classList.remove('theme-magna', 'theme-classic', 'theme-dark');
    document.body.classList.add('theme-' + tema);
    localStorage.setItem('tema_preferido', tema);
    atualizarStatus("Tema: " + tema.toUpperCase());
}

// --- CONTROLE DE LOOP ---
function configurarLoop() {
    let input = prompt("Quantas vezes deseja repetir a oração?", "1");
    let num = parseInt(input);
    if (!isNaN(num) && num > 0) {
        loopsTotais = num;
        atualizarStatus(`Repetição configurada: ${num}x`);
    } else {
        loopsTotais = 1;
    }
}

function atualizarStatus(msg) { document.getElementById('status-display').innerText = msg; }

// --- CENTRAL DE CONTROLE DE ÁUDIO ---
function controlarAudio(acao) {
    if (acao === 'stop') {
        pararVigia(); // Para de forçar o áudio
        synth.cancel(); 
        playerMusica.pause(); 
        playerMusica.currentTime = 0;
        loopsExecutados = 0; 
        isPausado = false; 
        modoAtual = null;
        atualizarStatus("Parado"); 
        
        // Limpa a notificação de mídia do celular
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = "none";
        }
        return;
    }

    if (acao === 'pause') {
        isPausado = true; // Usuário pediu pause explicitamente
        if (modoAtual === 'tts') synth.pause();
        if (modoAtual === 'mp3') playerMusica.pause();
        atualizarStatus("Pausado");
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "paused";
    }

    if (acao === 'resume') {
        if (isPausado) {
            isPausado = false;
            if (modoAtual === 'tts') synth.resume();
            if (modoAtual === 'mp3') {
                playerMusica.play();
                iniciarVigia(); // Reativa a proteção contra pausas do sistema
            }
            atualizarStatus("Reproduzindo...");
            if ('mediaSession' in navigator) navigator.mediaSession.playbackState = "playing";
        }
    }
}

// --- O "VIGIA" (SISTEMA ANTI-INTERRUPÇÃO) ---
// Isso força o áudio a voltar se o WhatsApp ou Ligação tentar pausar
function iniciarVigia() {
    if (watcherInterval) clearInterval(watcherInterval);
    
    watcherInterval = setInterval(() => {
        // Se NÃO foi pausado pelo usuário, mas o player tá pausado (obra do sistema/ligação)
        if (!isPausado && playerMusica.paused && modoAtual === 'mp3') {
            console.log("Sistema tentou pausar. Forçando retorno...");
            playerMusica.play().catch(e => console.log("Tentativa de force-play bloqueada: " + e));
        }
    }, 1000); // Verifica a cada 1 segundo
}

function pararVigia() {
    if (watcherInterval) clearInterval(watcherInterval);
}

// --- TTS (VOZ DO GOOGLE) ---
function falarPalavra(texto) {
    controlarAudio('stop');
    const u = new SpeechSynthesisUtterance(texto);
    const v = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (v) u.voice = v;
    u.rate = 0.8; synth.speak(u);
}

function iniciarTTS(btnElement) {
    controlarAudio('stop'); 
    textoAtual = btnElement.parentElement.previousElementSibling.innerText;
    modoAtual = 'tts'; loopsExecutados = 0; tocarTTSLoop();
}

function tocarTTSLoop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Recitando ${loopsExecutados}/${loopsTotais}`);
    utteranceAtual = new SpeechSynthesisUtterance(textoAtual);
    const vozLatina = vozes.find(v => v.lang.includes('it-IT')) || vozes.find(v => v.lang.includes('es-ES'));
    if (vozLatina) utteranceAtual.voice = vozLatina;
    utteranceAtual.rate = 0.8;
    
    // Hack para manter TTS ativo em background (O Chrome corta TTS longos)
    let resumeInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) clearInterval(resumeInterval);
        else window.speechSynthesis.resume();
    }, 14000);

    utteranceAtual.onend = () => { 
        clearInterval(resumeInterval);
        if (loopsExecutados < loopsTotais && !isPausado) tocarTTSLoop(); 
    };
    synth.speak(utteranceAtual);
}

// --- MP3 (MÚSICA) ---
function iniciarMusica(arquivo) {
    controlarAudio('stop'); 
    arquivoAtual = arquivo; 
    modoAtual = 'mp3';
    loopsExecutados = 0; 
    
    // Configura Metadados para o Celular (Importante para Calls)
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: arquivo.replace('.mp3', '').toUpperCase(),
            artist: 'Schola Exorcistae',
            album: 'Codex Magna v3.0',
            artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/107/107831.png', sizes: '512x512', type: 'image/png' }]
        });
        
        navigator.mediaSession.setActionHandler('play', () => controlarAudio('resume'));
        navigator.mediaSession.setActionHandler('pause', () => controlarAudio('pause'));
        navigator.mediaSession.setActionHandler('stop', () => controlarAudio('stop'));
    }

    tocarMP3Loop();
}

function tocarMP3Loop() {
    if (loopsExecutados >= loopsTotais) return;
    loopsExecutados++;
    atualizarStatus(`Cantando ${loopsExecutados}/${loopsTotais}`);
    
    playerMusica.src = "mp3/" + arquivoAtual;
    
    // Evento se o sistema pausar
    playerMusica.onpause = () => {
        if (!isPausado) {
            // Se não fui eu que pausei, foi o sistema (Ligação/Zap).
            // O Vigia vai tentar religar em 1s, mas tentamos aqui também.
            playerMusica.play().catch(e => console.log("Bloqueio de sistema momentâneo."));
        }
    };

    playerMusica.onended = () => { if (loopsExecutados < loopsTotais) tocarMP3Loop(); };
    
    playerMusica.play()
        .then(() => iniciarVigia()) // Liga a proteção assim que começa a tocar
        .catch(() => atualizarStatus("Erro MP3 (Toque na tela)"));
}

// --- DICIONÁRIO ---
const dicionarioDB = [
    { latin: "Absolutio", pt: "Absolvição" }, { latin: "Adsum", pt: "Aqui estou" },
    { latin: "Agnus Dei", pt: "Cordeiro de Deus" }, { latin: "Altare", pt: "Altar" },
    { latin: "Caelum", pt: "Céu" }, { latin: "Daemon", pt: "Demônio" },
    { latin: "Exorcizamus", pt: "Exorcizamos" }, { latin: "Vade Retro", pt: "Afasta-te" },
    { latin: "Benedictus", pt: "Bendito" }, { latin: "Spiritus", pt: "Espírito" }
];

function renderizarDicionario(lista) {
    const container = document.getElementById('lista-palavras');
    container.innerHTML = lista.map(i => `
        <div class="dict-item">
            <div><strong style="color:var(--gold)">${i.latin}</strong> ➔ ${i.pt}</div>
            <button class="btn-play" style="flex:none; min-width:auto; padding:5px 10px;" onclick="falarPalavra('${i.latin}')">🔊</button>
        </div>
    `).join('');
}

function pesquisar() {
    const t = document.getElementById('searchInput').value.toLowerCase();
    const f = dicionarioDB.filter(i => i.latin.toLowerCase().includes(t) || i.pt.toLowerCase().includes(t));
    renderizarDicionario(f);
}
