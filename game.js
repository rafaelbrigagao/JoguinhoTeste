const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Configuração do canvas
canvas.width = 800;
canvas.height = 600;

// Configurações do foguete
const rocket = {
    x: canvas.width / 2,
    y: 100,
    width: 40,
    height: 90,
    velocityY: 2,
    velocityX: 0,
    thrust: 0.5,
    rotation: 0, // Ângulo de rotação em radianos
    rotationSpeed: 0.1, // Velocidade de rotação
    isThrusting: false,
    exploded: false,
    explosionParticles: [],
    currentDesign: 1,
    image: null
};

// Configurações do terreno
const ground = {
    y: canvas.height - 50,
    height: 50,
    craters: []
};

// Configurações do jogo
const game = {
    gravity: 0.15,
    gameOver: false,
    success: false,
    fireworks: [],
    lastFireworkTime: 0,
    fireworkDelay: 350,
    continuousFireworks: true,
    displaySpeed: 0,
    configScreen: false,
    gameStarted: false,
    currentPlanet: 'terra' // Adiciona o planeta atual
};

// Configurações dos cenários
const scenarios = {
    terra: {
        groundColor: '#2d5a27', // Verde escuro para grama
        skyColor: '#000033', // Azul escuro para noite
        craterColor: '#1a3d17', // Verde mais escuro para crateras
        particleColor: '#2d5a27' // Cor das partículas de terra
    },
    lua: {
        groundColor: '#cccccc', // Cinza claro para superfície lunar
        skyColor: '#000000', // Preto para espaço
        craterColor: '#999999', // Cinza mais escuro para crateras
        particleColor: '#cccccc' // Cor das partículas de poeira lunar
    },
    marte: {
        groundColor: '#c1440e', // Marrom avermelhado para Marte
        skyColor: '#000000', // Preto para espaço
        craterColor: '#8b2e0a', // Marrom mais escuro para crateras
        particleColor: '#c1440e' // Cor das partículas de poeira marciana
    }
};

// Carrega as imagens dos foguetes
const rocketImages = {
    1: new Image(),
    2: new Image(),
    3: new Image()
};

rocketImages[1].src = 'rocket1.png';
rocketImages[2].src = 'rocket2.png';
rocketImages[3].src = 'rocket3.png';

// Adiciona eventos touch
document.addEventListener('DOMContentLoaded', () => {
    const configScreen = document.getElementById('configScreen');
    const configButton = document.getElementById('configButton');
    const okButton = document.getElementById('okButton');
    const startMessage = document.getElementById('startMessage');
    const restartButton = document.getElementById('restartButton');
    const gravityOptions = document.querySelectorAll('[data-gravity]');
    const rocketOptions = document.querySelectorAll('[data-rocket]');
    const rocketPreview = document.getElementById('rocketPreview');

    // Adiciona eventos de teclado para os botões direcionais
    document.addEventListener('keydown', (event) => {
        if (!game.gameOver && !game.configScreen) {
            switch(event.key) {
                case 'ArrowDown':
                    rocket.isThrusting = true;
                    break;
                case 'ArrowLeft':
                    rocket.rotation -= rocket.rotationSpeed;
                    break;
                case 'ArrowRight':
                    rocket.rotation += rocket.rotationSpeed;
                    break;
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        if (event.key === 'ArrowDown') {
            rocket.isThrusting = false;
        }
    });

    // Mostra/esconde menu de configuração
    configButton.addEventListener('click', () => {
        configScreen.style.display = configScreen.style.display === 'none' ? 'flex' : 'none';
        game.configScreen = configScreen.style.display === 'flex';
    });

    // Fecha o menu de configuração ao clicar em OK
    okButton.addEventListener('click', () => {
        configScreen.style.display = 'none';
        game.configScreen = false;
    });

    // Função para iniciar/reiniciar o jogo
    function startOrRestartGame() {
        if (!game.gameStarted) {
            game.gameStarted = true;
            startMessage.style.display = 'none';
            restartButton.textContent = 'Reiniciar';
        }
        resetGame();
        game.gameOver = false;
        game.success = false;
        restartButton.style.display = 'none';
    }

    // Adiciona evento de iniciar/reiniciar
    restartButton.addEventListener('click', startOrRestartGame);

    // Adiciona evento touch para iniciar/reiniciar
    restartButton.addEventListener('touchstart', (event) => {
        event.preventDefault();
        startOrRestartGame();
    });

    // Seleciona opção de gravidade
    gravityOptions.forEach(option => {
        option.addEventListener('click', () => {
            gravityOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            game.gravity = parseFloat(option.dataset.gravity);
            
            // Atualiza o planeta atual baseado na gravidade
            if (game.gravity === 0.15) {
                game.currentPlanet = 'terra';
            } else if (game.gravity === 0.025) {
                game.currentPlanet = 'lua';
            } else if (game.gravity === 0.06) {
                game.currentPlanet = 'marte';
            }
        });
    });

    // Seleciona design do foguete
    rocketOptions.forEach(option => {
        option.addEventListener('click', () => {
            rocketOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            const design = parseInt(option.dataset.rocket);
            rocket.currentDesign = design;
            rocketPreview.src = `rocket${design}.png`;
        });
    });

    // Inicia o jogo com toque na tela
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (!game.gameStarted && !game.configScreen) {
            game.gameStarted = true;
            startMessage.style.display = 'none';
            resetGame();
        }
    });

    // Controles touch
    const upBtn = document.querySelector('.control-btn.up');
    const downBtn = document.querySelector('.control-btn.down');
    const leftBtn = document.querySelector('.control-btn.left');
    const rightBtn = document.querySelector('.control-btn.right');

    // Controle de impulso
    downBtn.addEventListener('click', () => {
        if (!game.gameOver) {
            rocket.isThrusting = true;
        }
    });

    downBtn.addEventListener('mouseup', () => {
        rocket.isThrusting = false;
    });

    downBtn.addEventListener('mouseleave', () => {
        rocket.isThrusting = false;
    });

    downBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (!game.gameOver) {
            rocket.isThrusting = true;
        }
    });

    downBtn.addEventListener('touchend', (event) => {
        event.preventDefault();
        rocket.isThrusting = false;
    });

    // Controle de rotação
    leftBtn.addEventListener('click', () => {
        if (!game.gameOver) {
            rocket.rotation -= rocket.rotationSpeed;
        }
    });

    rightBtn.addEventListener('click', () => {
        if (!game.gameOver) {
            rocket.rotation += rocket.rotationSpeed;
        }
    });

    leftBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (!game.gameOver) {
            rocket.rotation -= rocket.rotationSpeed;
        }
    });

    rightBtn.addEventListener('touchstart', (event) => {
        event.preventDefault();
        if (!game.gameOver) {
            rocket.rotation += rocket.rotationSpeed;
        }
    });
});

// Classe para partículas de fogo de artifício
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 8,
            y: (Math.random() - 0.5) * 8
        };
        this.alpha = 1;
        this.friction = 0.95;
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }

    draw() {
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Classe para fogos de artifício
class Firework {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height;
        this.targetY = canvas.height * 0.3 + Math.random() * canvas.height * 0.2;
        this.velocity = {
            x: (Math.random() - 0.5) * 2,
            y: -20 - Math.random() * 5
        };
        this.particles = [];
        this.exploded = false;
        this.colors = [
            '0, 255, 0',    // Verde
            '255, 255, 0',  // Amarelo
            '255, 0, 0',    // Vermelho
            '0, 0, 255',    // Azul
            '128, 0, 128'   // Roxo
        ];
        // Adiciona contador estático para controlar o efeito especial
        if (!Firework.counter) {
            Firework.counter = 0;
        }
        Firework.counter++;
    }

    update() {
        if (!this.exploded) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;

            // Verifica se chegou no ponto de explosão
            if (this.y <= this.targetY) {
                this.explode();
                this.exploded = true;
            }
        }

        // Atualiza partículas
        this.particles = this.particles.filter(particle => particle.alpha > 0);
        this.particles.forEach(particle => particle.update());
    }

    explode() {
        const color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        // Verifica se é o quarto ou o oitavo foguete para criar o efeito especial
        if (Firework.counter % 8 === 0) {
            this.createHeartParticles(color);
        } else if (Firework.counter % 8 === 4) {
            this.createSmileyParticles(color);
        } else {
            // Explosão normal
            for (let i = 0; i < 50; i++) {
                this.particles.push(new Particle(this.x, this.y, color));
            }
        }
    }

    createHeartParticles(color) {
        // Cria partículas em formato de coração
        const heartSize = 8; // Reduzido de 15 para 8
        const particleCount = 50; // Reduzido de 100 para 50
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const heartX = 16 * Math.pow(Math.sin(angle), 3);
            const heartY = -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle));
            
            const particle = new Particle(
                this.x + heartX * heartSize,
                this.y + heartY * heartSize,
                color
            );
            
            // Ajusta a velocidade para criar um efeito mais suave
            particle.velocity = {
                x: heartX * 0.5,
                y: heartY * 0.5
            };
            
            this.particles.push(particle);
        }
    }

    createSmileyParticles(color) {
        const smileySize = 8;
        const particleCount = 50;
        
        // Cria o contorno do rosto
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const x = Math.cos(angle) * smileySize * 2;
            const y = Math.sin(angle) * smileySize * 2;
            
            const particle = new Particle(
                this.x + x,
                this.y + y,
                color
            );
            
            particle.velocity = {
                x: x * 0.3,
                y: y * 0.3
            };
            
            this.particles.push(particle);
        }
        
        // Cria os olhos
        const eyeCount = 10;
        for (let i = 0; i < eyeCount; i++) {
            const angle = (i / eyeCount) * Math.PI * 2;
            
            // Olho esquerdo
            const leftEyeX = Math.cos(angle) * smileySize * 0.5 - smileySize * 0.8;
            const leftEyeY = Math.sin(angle) * smileySize * 0.5 - smileySize * 0.3;
            
            const leftParticle = new Particle(
                this.x + leftEyeX,
                this.y + leftEyeY,
                color
            );
            
            leftParticle.velocity = {
                x: leftEyeX * 0.3,
                y: leftEyeY * 0.3
            };
            
            this.particles.push(leftParticle);
            
            // Olho direito
            const rightEyeX = Math.cos(angle) * smileySize * 0.5 + smileySize * 0.8;
            const rightEyeY = Math.sin(angle) * smileySize * 0.5 - smileySize * 0.3;
            
            const rightParticle = new Particle(
                this.x + rightEyeX,
                this.y + rightEyeY,
                color
            );
            
            rightParticle.velocity = {
                x: rightEyeX * 0.3,
                y: rightEyeY * 0.3
            };
            
            this.particles.push(rightParticle);
        }
        
        // Cria o sorriso
        const smileCount = 20;
        for (let i = 0; i < smileCount; i++) {
            const angle = (i / smileCount) * Math.PI;
            const smileX = Math.cos(angle) * smileySize * 1.5;
            const smileY = Math.sin(angle) * smileySize * 0.5 + smileySize * 0.5;
            
            const particle = new Particle(
                this.x + smileX,
                this.y + smileY,
                color
            );
            
            particle.velocity = {
                x: smileX * 0.3,
                y: smileY * 0.3
            };
            
            this.particles.push(particle);
        }
    }

    draw() {
        if (!this.exploded) {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        this.particles.forEach(particle => particle.draw());
    }
}

// Classe para partículas da explosão do foguete
class RocketParticle {
    constructor(x, y, velocity) {
        this.x = x;
        this.y = y;
        this.velocity = {
            x: (Math.random() - 0.5) * velocity,
            y: (Math.random() - 0.5) * velocity
        };
        this.alpha = 1;
        this.friction = 0.98;
        
        // Cores baseadas no foguete e fogo
        const rocketColors = ['#ffffff', '#cccccc']; // Branco e cinza do foguete
        const fireColors = ['#ff6600', '#ffff00', '#ff0000']; // Laranja, amarelo e vermelho do fogo
        
        // 70% de chance de ser cor do foguete, 30% de chance de ser cor de fogo
        const isRocketColor = Math.random() < 0.7;
        this.color = isRocketColor 
            ? rocketColors[Math.floor(Math.random() * rocketColors.length)]
            : fireColors[Math.floor(Math.random() * fireColors.length)];
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
    }

    draw() {
        ctx.fillStyle = this.color.replace(')', `, ${this.alpha})`).replace('rgb', 'rgba');
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Classe para crateras
class Crater {
    constructor(x, depth) {
        this.x = x;
        this.y = ground.y;
        this.depth = depth;
        this.width = depth * 2;
        this.alpha = 1;
        this.particles = [];
        
        // Cria partículas de terra
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.x,
                y: this.y,
                velocityX: (Math.random() - 0.5) * 5,
                velocityY: -Math.random() * 5,
                alpha: 1,
                color: scenarios[game.currentPlanet].particleColor
            });
        }
    }

    update() {
        // Atualiza partículas
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocityX;
            particle.y += particle.velocityY;
            particle.velocityY += 0.1; // gravidade
            particle.alpha -= 0.02;
            return particle.alpha > 0;
        });
    }

    draw() {
        const scenario = scenarios[game.currentPlanet];
        
        // Desenha a cratera
        ctx.fillStyle = `rgba(0, 0, 0, ${this.alpha * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/2, this.y);
        ctx.quadraticCurveTo(this.x, this.y + this.depth, this.x + this.width/2, this.y);
        ctx.fill();

        // Desenha partículas
        this.particles.forEach(particle => {
            ctx.fillStyle = `rgba(${scenario.particleColor}, ${particle.alpha})`;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}

// Função para desenhar o foguete
function drawRocket() {
    const x = rocket.x;
    const y = rocket.y;
    
    // Salva o estado atual do contexto
    ctx.save();
    
    // Move para o centro do foguete e aplica a rotação
    ctx.translate(x, y + rocket.height/2);
    ctx.rotate(rocket.rotation);
    
    // Desenha a imagem do foguete
    if (rocketImages[rocket.currentDesign].complete) {
        ctx.drawImage(
            rocketImages[rocket.currentDesign],
            -rocket.width/2,
            -rocket.height/2,
            rocket.width,
            rocket.height
        );
    } else {
        // Fallback para o desenho original se a imagem não estiver carregada
        drawDefaultRocket();
    }
    
    // Desenha a chama do motor se estiver acionado
    if (rocket.isThrusting) {
        drawRocketFlame();
    }
    
    // Restaura o estado do contexto
    ctx.restore();
}

// Função para desenhar o foguete padrão (fallback)
function drawDefaultRocket() {
    // Corpo principal do foguete
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -rocket.height/2);
    ctx.lineTo(-15, rocket.height/2);
    ctx.lineTo(15, rocket.height/2);
    ctx.closePath();
    ctx.fill();
    
    // Detalhes do corpo
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -rocket.height/2 + 15);
    ctx.lineTo(-12, rocket.height/2 - 15);
    ctx.moveTo(0, -rocket.height/2 + 15);
    ctx.lineTo(12, rocket.height/2 - 15);
    ctx.stroke();
    
    // Aletas
    ctx.fillStyle = '#cccccc';
    ctx.beginPath();
    ctx.moveTo(-15, rocket.height/2);
    ctx.lineTo(-25, rocket.height/2 + 10);
    ctx.lineTo(-5, rocket.height/2 + 10);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(15, rocket.height/2);
    ctx.lineTo(25, rocket.height/2 + 10);
    ctx.lineTo(5, rocket.height/2 + 10);
    ctx.closePath();
    ctx.fill();
    
    // Janela da cabine
    ctx.fillStyle = '#87CEEB';
    ctx.beginPath();
    ctx.arc(0, -rocket.height/2 + 15, 5, 0, Math.PI * 2);
    ctx.fill();
}

// Função para desenhar a chama do motor
function drawRocketFlame() {
    // Motor
    ctx.fillStyle = '#444444';
    ctx.beginPath();
    ctx.moveTo(-8, rocket.height/2);
    ctx.lineTo(-12, rocket.height/2 + 10);
    ctx.lineTo(12, rocket.height/2 + 10);
    ctx.lineTo(8, rocket.height/2);
    ctx.closePath();
    ctx.fill();
    
    // Chama do motor
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(-8, rocket.height/2 + 10);
    ctx.lineTo(8, rocket.height/2 + 10);
    ctx.lineTo(0, rocket.height/2 + 30);
    ctx.closePath();
    ctx.fill();
    
    // Brilho da chama
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.moveTo(-4, rocket.height/2 + 10);
    ctx.lineTo(4, rocket.height/2 + 10);
    ctx.lineTo(0, rocket.height/2 + 25);
    ctx.closePath();
    ctx.fill();
}

// Função para criar cratera
function createCrater() {
    const depth = Math.min(Math.abs(rocket.velocityY) * 3, 30);
    ground.craters.push(new Crater(rocket.x, depth));
}

// Função para atualizar crateras
function updateCraters() {
    ground.craters = ground.craters.filter(crater => crater.alpha > 0);
    ground.craters.forEach(crater => crater.update());
}

// Função para desenhar crateras
function drawCraters() {
    ground.craters.forEach(crater => crater.draw());
}

// Função para desenhar o terreno
function drawGround() {
    const scenario = scenarios[game.currentPlanet];
    
    // Desenha o céu
    ctx.fillStyle = scenario.skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Desenha o chão
    ctx.fillStyle = scenario.groundColor;
    ctx.fillRect(0, ground.y, canvas.width, ground.height);
    
    // Desenha as crateras
    drawCraters();
}

// Função para criar explosão do foguete
function createRocketExplosion() {
    const particleCount = Math.min(Math.abs(rocket.velocityY) * 20, 100);
    for (let i = 0; i < particleCount; i++) {
        rocket.explosionParticles.push(new RocketParticle(
            rocket.x,
            rocket.y + rocket.height/2,
            Math.abs(rocket.velocityY) * 2
        ));
    }
}

// Função para atualizar partículas da explosão
function updateRocketExplosion() {
    rocket.explosionParticles = rocket.explosionParticles.filter(particle => particle.alpha > 0);
    rocket.explosionParticles.forEach(particle => particle.update());
}

// Função para desenhar partículas da explosão
function drawRocketExplosion() {
    rocket.explosionParticles.forEach(particle => particle.draw());
}

// Função para atualizar a posição do foguete
function updateRocket() {
    // Aplica a gravidade
    rocket.velocityY += game.gravity;
    
    // Aplica o impulso do motor se estiver acionado
    if (rocket.isThrusting) {
        // Aplica o impulso na direção da rotação
        rocket.velocityY -= rocket.thrust * Math.cos(rocket.rotation);
        rocket.velocityX += rocket.thrust * Math.sin(rocket.rotation);
    }
    
    // Atualiza a posição vertical
    rocket.y += rocket.velocityY;
    
    // Atualiza a posição horizontal
    rocket.x += rocket.velocityX;
    
    // Limita o movimento horizontal
    if (rocket.x < 40) rocket.x = 40;
    if (rocket.x > canvas.width - 40) rocket.x = canvas.width - 40;
    
    // Verifica colisão com o chão
    if (rocket.y + rocket.height > ground.y) {
        rocket.y = ground.y - rocket.height;
        
        // Verifica se a aterrissagem foi suave
        const verticalSpeed = Math.abs(rocket.velocityY);
        const rotationSpeed = Math.abs(rocket.rotation);
        const isSoftLanding = verticalSpeed < 8 && rotationSpeed < 0.5;
        
        if (!game.gameOver) {  // Só processa a colisão se o jogo ainda não acabou
            if (isSoftLanding) {
                game.success = true;
                game.gameOver = true;
            } else if (!rocket.exploded) {
                rocket.exploded = true;
                createRocketExplosion();
                createCrater();
                game.gameOver = true;
            }
        }
    }
}

// Função para lançar fogos de artifício
function launchFirework() {
    const currentTime = Date.now();
    
    if (game.continuousFireworks && currentTime - game.lastFireworkTime >= game.fireworkDelay) {
        game.fireworks.push(new Firework());
        game.lastFireworkTime = currentTime;
    }
}

// Função para atualizar fogos de artifício
function updateFireworks() {
    game.fireworks = game.fireworks.filter(firework => 
        !firework.exploded || firework.particles.length > 0
    );
    game.fireworks.forEach(firework => firework.update());
}

// Função para desenhar fogos de artifício
function drawFireworks() {
    game.fireworks.forEach(firework => firework.draw());
}

// Função para redimensionar o canvas
function resizeCanvas() {
    // Define o tamanho do canvas como o tamanho da janela menos 6 pixels (3 de cada lado)
    canvas.width = window.innerWidth - 6;
    canvas.height = window.innerHeight - 6;
    
    // Atualiza a posição do chão
    ground.y = canvas.height - 50;
    
    // Se o foguete estiver abaixo da nova posição do chão, ajusta sua posição
    if (rocket.y + rocket.height > ground.y) {
        rocket.y = ground.y - rocket.height;
    }
    
    // Se o foguete estiver fora dos limites horizontais, ajusta sua posição
    if (rocket.x < 40) rocket.x = 40;
    if (rocket.x > canvas.width - 40) rocket.x = canvas.width - 40;
}

// Adiciona evento de redimensionamento da janela
window.addEventListener('resize', resizeCanvas);

// Chama a função inicialmente
resizeCanvas();

// Função para reiniciar o jogo
function resetGame() {
    // Reseta a posição do foguete
    rocket.x = canvas.width / 2;
    rocket.y = 50; // Posiciona no topo da tela com uma pequena margem
    rocket.velocityY = 0; // Começa com velocidade vertical zero
    rocket.velocityX = 0;
    rocket.rotation = 0;
    rocket.isThrusting = false;
    rocket.exploded = false;
    rocket.explosionParticles = [];
    
    // Reseta o terreno
    ground.craters = [];
    
    // Reseta o estado do jogo
    game.gameOver = false;
    game.success = false;
    game.fireworks = [];
    game.lastFireworkTime = 0;
    game.displaySpeed = 0;
}

// Função para desenhar números digitais
function drawDigitalNumber(x, y, number, size = 1) {
    const segments = {
        0: [1,1,1,1,1,1,0], // top, top right, bottom right, bottom, bottom left, top left, middle
        1: [0,1,1,0,0,0,0],
        2: [1,1,0,1,1,0,1],
        3: [1,1,1,1,0,0,1],
        4: [0,1,1,0,1,1,1],
        5: [1,0,1,1,0,1,1],
        6: [1,0,1,1,1,1,1],
        7: [1,1,1,0,0,0,0],
        8: [1,1,1,1,1,1,1],
        9: [1,1,1,1,0,1,1]
    };

    const segmentWidth = 10 * size;
    const segmentHeight = 2 * size;
    const spacing = 2 * size;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 * size;

    // Desenha cada segmento do número
    const numberSegments = segments[number];
    if (!numberSegments) return;

    // Segmento superior
    if (numberSegments[0]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + segmentWidth, y);
        ctx.stroke();
    }

    // Segmento superior direito
    if (numberSegments[1]) {
        ctx.beginPath();
        ctx.moveTo(x + segmentWidth, y);
        ctx.lineTo(x + segmentWidth, y + segmentHeight + spacing);
        ctx.stroke();
    }

    // Segmento inferior direito
    if (numberSegments[2]) {
        ctx.beginPath();
        ctx.moveTo(x + segmentWidth, y + segmentHeight + spacing);
        ctx.lineTo(x + segmentWidth, y + (segmentHeight + spacing) * 2);
        ctx.stroke();
    }

    // Segmento inferior
    if (numberSegments[3]) {
        ctx.beginPath();
        ctx.moveTo(x, y + (segmentHeight + spacing) * 2);
        ctx.lineTo(x + segmentWidth, y + (segmentHeight + spacing) * 2);
        ctx.stroke();
    }

    // Segmento inferior esquerdo
    if (numberSegments[4]) {
        ctx.beginPath();
        ctx.moveTo(x, y + segmentHeight + spacing);
        ctx.lineTo(x, y + (segmentHeight + spacing) * 2);
        ctx.stroke();
    }

    // Segmento superior esquerdo
    if (numberSegments[5]) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + segmentHeight + spacing);
        ctx.stroke();
    }

    // Segmento do meio
    if (numberSegments[6]) {
        ctx.beginPath();
        ctx.moveTo(x, y + segmentHeight + spacing);
        ctx.lineTo(x + segmentWidth, y + segmentHeight + spacing);
        ctx.stroke();
    }
}

// Função para desenhar o velocímetro
function drawSpeedometer() {
    // Atualiza a velocidade exibida suavemente
    const targetSpeed = game.gameOver ? 0 : Math.abs(rocket.velocityY);
    game.displaySpeed += (targetSpeed - game.displaySpeed) * 0.1;
    
    const speed = game.displaySpeed.toFixed(1);
    const x = 30;
    const y = 30;
    
    // Desenha o fundo do velocímetro
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x - 10, y - 10, 104, 52);
    
    // Desenha os números
    const digits = speed.split('.');
    drawDigitalNumber(x, y, parseInt(digits[0]), 1.3);
    drawDigitalNumber(x + 32, y, parseInt(digits[1]), 1.3);
    
    // Desenha o ponto decimal
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x + 58, y + 32, 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Desenha a unidade m/s
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('m/s', x + 65, y + 15);
}

// Função principal do jogo
function gameLoop() {
    // Limpa o canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (game.gameStarted && !game.configScreen) {
        // Desenha os elementos
        drawGround();
        
        // Atualiza e desenha o foguete ou sua explosão
        if (!rocket.exploded) {
            drawRocket();
        }
        updateRocket();
        
        // Atualiza e desenha fogos de artifício
        updateFireworks();
        drawFireworks();
        if (game.success) {
            launchFirework();
        }
        
        // Atualiza e desenha explosão do foguete
        if (rocket.exploded) {
            updateRocketExplosion();
            drawRocketExplosion();
        }
        
        // Atualiza crateras
        updateCraters();
        
        // Desenha o velocímetro
        drawSpeedometer();
        
        // Mostra mensagem de game over e botão de reiniciar
        if (game.gameOver) {
            ctx.fillStyle = '#fff';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            if (game.success) {
                ctx.fillText('Aterrissagem Suave!', canvas.width/2, canvas.height/2 - 30);
            } else {
                ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 30);
            }
            // Mostra o botão de reiniciar
            document.getElementById('restartButton').style.display = 'block';
        }
    } else if (!game.gameStarted) {
        // Mostra o botão de iniciar quando o jogo não começou
        document.getElementById('restartButton').style.display = 'block';
    }
    
    // Continua o loop do jogo
    requestAnimationFrame(gameLoop);
}

// Inicia o jogo
gameLoop(); 