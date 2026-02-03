/**
 * TECH LEAD INTERVIEW SIMULATOR
 * App.js - Lógica principal con carga dinámica de JSON
 */

class SimuladorEntrevista {
    constructor() {
        this.preguntas = [];
        this.preguntasFiltradas = [];
        this.preguntaActual = 0;
        this.respuestaVisible = false;
        this.categoriaSeleccionada = 'todas';
        this.dificultadSeleccionada = 'todas';
        this.cantidadPreguntas = 10;

        this.init();
    }

    async init() {
        await this.cargarPreguntas();
        this.bindEvents();
        this.actualizarContadores();
    }

    // ==========================================
    // CARGA DINÁMICA DE DATOS
    // ==========================================
    async cargarPreguntas() {
        try {
            const response = await fetch('./data/preguntas.json');
            if (!response.ok) throw new Error('Error cargando preguntas');
            const data = await response.json();
            this.preguntas = data.preguntas;
            console.log(`✅ Cargadas ${this.preguntas.length} preguntas`);
        } catch (error) {
            console.error('❌ Error cargando preguntas:', error);
            this.mostrarError('No se pudieron cargar las preguntas. Recarga la página.');
        }
    }

    // ==========================================
    // EVENT BINDINGS
    // ==========================================
    bindEvents() {
        // Navegación móvil
        const hamburger = document.getElementById('hamburger');
        const nav = document.querySelector('.nav');
        hamburger?.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Cerrar menú al hacer click en link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger?.classList.remove('active');
                nav?.classList.remove('active');
            });
        });

        // Configuración del simulador
        document.getElementById('select-categoria')?.addEventListener('change', (e) => {
            this.categoriaSeleccionada = e.target.value;
        });

        document.getElementById('select-dificultad')?.addEventListener('change', (e) => {
            this.dificultadSeleccionada = e.target.value;
        });

        document.getElementById('select-cantidad')?.addEventListener('change', (e) => {
            this.cantidadPreguntas = e.target.value === 'todas' ? 999 : parseInt(e.target.value);
        });

        // Botón iniciar
        document.getElementById('btn-iniciar')?.addEventListener('click', () => {
            this.iniciarEntrevista();
        });

        // Botones de entrevista
        document.getElementById('btn-pista')?.addEventListener('click', () => {
            this.mostrarPista();
        });

        document.getElementById('btn-respuesta')?.addEventListener('click', () => {
            this.toggleRespuesta();
        });

        document.getElementById('btn-anterior')?.addEventListener('click', () => {
            this.preguntaAnterior();
        });

        document.getElementById('btn-siguiente')?.addEventListener('click', () => {
            this.siguientePregunta();
        });

        document.getElementById('btn-terminar')?.addEventListener('click', () => {
            this.terminarEntrevista();
        });

        document.getElementById('btn-reiniciar')?.addEventListener('click', () => {
            this.reiniciarSimulador();
        });

        document.getElementById('btn-revisar')?.addEventListener('click', () => {
            this.revisarRespuestas();
        });

        // Copiar código
        document.getElementById('btn-copy')?.addEventListener('click', () => {
            this.copiarCodigo();
        });

        // Cards de categoría
        document.querySelectorAll('.categoria-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoria = card.dataset.categoria;
                document.getElementById('select-categoria').value = categoria;
                this.categoriaSeleccionada = categoria;
                document.getElementById('simulador').scrollIntoView({ behavior: 'smooth' });
            });
        });

        // Smooth scroll para links internos
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                target?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    // ==========================================
    // LÓGICA DEL SIMULADOR
    // ==========================================
    iniciarEntrevista() {
        // Filtrar preguntas
        this.preguntasFiltradas = this.preguntas.filter(p => {
            const categoriaOk = this.categoriaSeleccionada === 'todas' || p.categoria === this.categoriaSeleccionada;
            const dificultadOk = this.dificultadSeleccionada === 'todas' || p.dificultad === this.dificultadSeleccionada;
            return categoriaOk && dificultadOk;
        });

        // Mezclar y limitar
        this.preguntasFiltradas = this.shuffleArray(this.preguntasFiltradas)
            .slice(0, this.cantidadPreguntas);

        if (this.preguntasFiltradas.length === 0) {
            this.mostrarError('No hay preguntas con los filtros seleccionados.');
            return;
        }

        this.preguntaActual = 0;
        this.respuestaVisible = false;

        // Mostrar panel de entrevista
        document.getElementById('config-panel').style.display = 'none';
        document.getElementById('entrevista-panel').style.display = 'block';
        document.getElementById('resultados-panel').style.display = 'none';

        // Actualizar total
        document.getElementById('pregunta-total').textContent = this.preguntasFiltradas.length;

        this.mostrarPregunta();
    }

    mostrarPregunta() {
        const pregunta = this.preguntasFiltradas[this.preguntaActual];
        if (!pregunta) return;

        // Actualizar número y progreso
        document.getElementById('pregunta-actual').textContent = this.preguntaActual + 1;
        const progreso = ((this.preguntaActual + 1) / this.preguntasFiltradas.length) * 100;
        document.getElementById('progress-fill').style.width = `${progreso}%`;

        // Categoría y dificultad
        document.getElementById('categoria-actual').textContent = this.capitalize(pregunta.categoria);
        const dificultadBadge = document.getElementById('dificultad-badge');
        dificultadBadge.innerHTML = `<i class="fas fa-star"></i> ${this.capitalize(pregunta.dificultad)}`;
        dificultadBadge.className = `dificultad-badge ${pregunta.dificultad}`;

        // Pregunta
        document.getElementById('pregunta-texto').textContent = pregunta.pregunta;

        // Ocultar respuesta
        document.getElementById('respuesta-container').style.display = 'none';
        this.respuestaVisible = false;
        document.getElementById('btn-respuesta').innerHTML = '<i class="fas fa-eye"></i> Ver Respuesta Modelo';

        // Botones de navegación
        document.getElementById('btn-anterior').disabled = this.preguntaActual === 0;

        const btnSiguiente = document.getElementById('btn-siguiente');
        if (this.preguntaActual === this.preguntasFiltradas.length - 1) {
            btnSiguiente.innerHTML = '<i class="fas fa-flag-checkered"></i> Finalizar';
        } else {
            btnSiguiente.innerHTML = 'Siguiente <i class="fas fa-arrow-right"></i>';
        }
    }

    toggleRespuesta() {
        const container = document.getElementById('respuesta-container');
        const btn = document.getElementById('btn-respuesta');

        if (this.respuestaVisible) {
            container.style.display = 'none';
            btn.innerHTML = '<i class="fas fa-eye"></i> Ver Respuesta Modelo';
        } else {
            this.mostrarRespuestaCompleta();
            container.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Respuesta';
        }
        this.respuestaVisible = !this.respuestaVisible;
    }

    mostrarRespuestaCompleta() {
        const pregunta = this.preguntasFiltradas[this.preguntaActual];

        // Respuesta HTML
        document.getElementById('respuesta-content').innerHTML = pregunta.respuesta;

        // Analogía
        document.getElementById('analogia-texto').textContent = pregunta.analogia;

        // Código (si existe)
        const codigoBox = document.getElementById('codigo-box');
        if (pregunta.codigo) {
            document.getElementById('codigo-ejemplo').textContent = pregunta.codigo;
            codigoBox.style.display = 'block';
        } else {
            codigoBox.style.display = 'none';
        }

        // Frase matadora
        document.getElementById('frase-texto').textContent = pregunta.frase;
    }

    mostrarPista() {
        const pregunta = this.preguntasFiltradas[this.preguntaActual];
        const pista = pregunta.analogia.split('.')[0] + '...';

        // Mostrar toast con pista
        this.mostrarToast(`💡 Pista: ${pista}`, 'info');
    }

    siguientePregunta() {
        if (this.preguntaActual < this.preguntasFiltradas.length - 1) {
            this.preguntaActual++;
            this.mostrarPregunta();
        } else {
            this.terminarEntrevista();
        }
    }

    preguntaAnterior() {
        if (this.preguntaActual > 0) {
            this.preguntaActual--;
            this.mostrarPregunta();
        }
    }

    terminarEntrevista() {
        document.getElementById('entrevista-panel').style.display = 'none';
        document.getElementById('resultados-panel').style.display = 'block';

        // Estadísticas
        document.getElementById('preguntas-vistas').textContent = this.preguntaActual + 1;

        const categorias = [...new Set(this.preguntasFiltradas.slice(0, this.preguntaActual + 1).map(p => p.categoria))];
        document.getElementById('categorias-cubiertas').textContent = categorias.length;
    }

    reiniciarSimulador() {
        document.getElementById('config-panel').style.display = 'block';
        document.getElementById('entrevista-panel').style.display = 'none';
        document.getElementById('resultados-panel').style.display = 'none';

        // Reset valores
        document.getElementById('select-categoria').value = 'todas';
        document.getElementById('select-dificultad').value = 'todas';
        document.getElementById('select-cantidad').value = '10';

        this.categoriaSeleccionada = 'todas';
        this.dificultadSeleccionada = 'todas';
        this.cantidadPreguntas = 10;
    }

    revisarRespuestas() {
        this.preguntaActual = 0;
        document.getElementById('resultados-panel').style.display = 'none';
        document.getElementById('entrevista-panel').style.display = 'block';
        this.mostrarPregunta();
    }

    copiarCodigo() {
        const codigo = document.getElementById('codigo-ejemplo').textContent;
        navigator.clipboard.writeText(codigo).then(() => {
            this.mostrarToast('✅ Código copiado al portapapeles', 'success');
        }).catch(() => {
            this.mostrarToast('❌ Error al copiar', 'error');
        });
    }

    // ==========================================
    // UTILIDADES
    // ==========================================
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    actualizarContadores() {
        const total = this.preguntas.length;
        document.getElementById('total-preguntas').textContent = `${total}+`;
    }

    mostrarToast(mensaje, tipo = 'info') {
        // Crear toast si no existe
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }

        toast.textContent = mensaje;
        toast.className = `toast toast-${tipo} show`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    mostrarError(mensaje) {
        this.mostrarToast(mensaje, 'error');
    }
}

// ==========================================
// ESTILOS DINÁMICOS PARA TOAST
// ==========================================
const toastStyles = `
.toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    padding: 1rem 2rem;
    background: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text);
    font-size: 0.95rem;
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
    max-width: 90%;
    text-align: center;
}

.toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

.toast-success {
    border-color: var(--color-success);
}

.toast-error {
    border-color: var(--color-error);
}

.toast-info {
    border-color: var(--color-primary);
}

.dificultad-badge.junior {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
}

.dificultad-badge.senior {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
}

.dificultad-badge.lead {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = toastStyles;
document.head.appendChild(styleSheet);

// ==========================================
// INICIALIZAR APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    window.simulador = new SimuladorEntrevista();
});
