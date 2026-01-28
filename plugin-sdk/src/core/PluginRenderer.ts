export class PluginRenderer {
    static mount(context: { jobId: string; jobTitle: string; company: string }) {
        const container = document.getElementById('plugin-container');
        if (!container) {
            console.warn('[FinalRoundPlugin] Container #plugin-container not found. Plugin execution skipped.');
            return;
        }

        // Prevent double mounting
        if (container.shadowRoot) {
            return;
        }

        // Create Shadow DOM for isolation
        const shadow = container.attachShadow({ mode: 'open' });

        // Inject Styles (Basic Reset for now)
        const style = document.createElement('style');
        style.textContent = `
            :host {
                display: block;
                font-family: 'Inter', sans-serif;
                margin-top: 2rem;
                margin-bottom: 2rem;
            }
            .plugin-wrapper {
                background: linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
                border: 1px solid rgba(139, 92, 246, 0.2);
                border-radius: 12px;
                padding: 1.5rem;
                color: #fff;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                backdrop-filter: blur(10px);
            }
            h2 {
                color: #a78bfa;
                margin-top: 0;
            }
            .status {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: #94a3b8;
            }
            .dot {
                width: 8px;
                height: 8px;
                background-color: #10b981;
                border-radius: 50%;
                box-shadow: 0 0 8px #10b981;
            }
        `;
        shadow.appendChild(style);

        // Render Initial UI (Placeholder until Phase 2)
        const wrapper = document.createElement('div');
        wrapper.className = 'plugin-wrapper';
        wrapper.innerHTML = `
            <div class="header">
                 <h2>⚡ FinalRound AI Task Allocation</h2>
                 <div class="status">
                    <span class="dot"></span>
                    <span>Plugin Active | Session: ${context.jobId.substring(0, 8)}...</span>
                 </div>
                 <p style="margin-top: 1rem; color: #cbd5e1;">
                    This job includes an AI-assisted outcome assessment. 
                    <br/>
                    <strong>Context Loaded:</strong> ${context.jobTitle} at ${context.company}
                 </p>
                 <button style="margin-top: 1rem; padding: 0.5rem 1rem; background: #8b5cf6; border: none; border-radius: 6px; color: white; cursor: pointer; font-weight: bold;">
                    Start Outcome Assessment
                 </button>
            </div>
        `;

        shadow.appendChild(wrapper);
        console.log('[FinalRoundPlugin] Mounted successfully in Shadow DOM');
    }
}
