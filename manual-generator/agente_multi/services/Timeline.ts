import * as fs from 'fs/promises';
import * as path from 'path';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'agent_start' | 'agent_end' | 'task_start' | 'task_end' | 'error' | 'milestone' | 'user_action';
  agent?: string;
  task?: string;
  description: string;
  metadata: Record<string, any>;
  duration?: number; // em ms
  status: 'success' | 'error' | 'warning' | 'info';
  parentEventId?: string;
  tags: string[];
}

interface TimelineSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  events: TimelineEvent[];
  metadata: Record<string, any>;
  summary?: string;
}

interface TimelineAnalysis {
  totalDuration: number;
  agentPerformance: Record<string, {
    totalTime: number;
    taskCount: number;
    successRate: number;
    averageTaskTime: number;
  }>;
  bottlenecks: Array<{
    description: string;
    duration: number;
    suggestions: string[];
  }>;
  timeline: Array<{
    time: Date;
    event: string;
    duration?: number;
  }>;
}

export class Timeline {
  private currentSession: TimelineSession | null = null;
  private sessionsFile: string;
  private eventStack: Map<string, TimelineEvent> = new Map();

  constructor() {
    this.sessionsFile = path.join(process.cwd(), 'output', 'timeline-sessions.json');
  }

  /**
   * Inicia uma nova sessão
   */
  async startSession(metadata: Record<string, any> = {}): Promise<string> {
    const sessionId = this.generateId();
    
    this.currentSession = {
      id: sessionId,
      startTime: new Date(),
      events: [],
      metadata
    };
    
    await this.recordEvent({
      type: 'milestone',
      description: 'Sessão iniciada',
      metadata: { sessionId },
      status: 'info',
      tags: ['session', 'start']
    });
    
    console.log(`⏱️ Timeline: Sessão ${sessionId} iniciada`);
    return sessionId;
  }

  /**
   * Finaliza a sessão atual
   */
  async endSession(summary?: string): Promise<void> {
    if (!this.currentSession) {
      throw new Error('Nenhuma sessão ativa');
    }
    
    this.currentSession.endTime = new Date();
    this.currentSession.summary = summary;
    
    await this.recordEvent({
      type: 'milestone',
      description: 'Sessão finalizada',
      metadata: { 
        sessionId: this.currentSession.id,
        duration: this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
      },
      status: 'info',
      tags: ['session', 'end']
    });
    
    await this.saveSession();
    console.log(`✅ Timeline: Sessão ${this.currentSession.id} finalizada`);
    
    this.currentSession = null;
  }

  /**
   * Registra um evento
   */
  async recordEvent(data: {
    type: TimelineEvent['type'];
    agent?: string;
    task?: string;
    description: string;
    metadata?: Record<string, any>;
    status: TimelineEvent['status'];
    tags?: string[];
    parentEventId?: string;
  }): Promise<string> {
    if (!this.currentSession) {
      throw new Error('Nenhuma sessão ativa');
    }
    
    const eventId = this.generateId();
    const event: TimelineEvent = {
      id: eventId,
      timestamp: new Date(),
      type: data.type,
      agent: data.agent,
      task: data.task,
      description: data.description,
      metadata: data.metadata || {},
      status: data.status,
      parentEventId: data.parentEventId,
      tags: data.tags || []
    };
    
    this.currentSession.events.push(event);
    
    // Log do evento
    const emoji = this.getEventEmoji(event.type, event.status);
    console.log(`${emoji} ${event.agent || 'System'}: ${event.description}`);
    
    return eventId;
  }

  /**
   * Inicia rastreamento de uma tarefa
   */
  async startTask(agent: string, task: string, description: string, metadata: Record<string, any> = {}): Promise<string> {
    const eventId = await this.recordEvent({
      type: 'task_start',
      agent,
      task,
      description: `Iniciando: ${description}`,
      metadata,
      status: 'info',
      tags: ['task', 'start', agent]
    });
    
    this.eventStack.set(`${agent}-${task}`, {
      id: eventId,
      timestamp: new Date(),
      type: 'task_start',
      agent,
      task,
      description,
      metadata,
      status: 'info',
      tags: ['task', 'start']
    });
    
    return eventId;
  }

  /**
   * Finaliza rastreamento de uma tarefa
   */
  async endTask(agent: string, task: string, status: 'success' | 'error', result?: any): Promise<void> {
    const startEvent = this.eventStack.get(`${agent}-${task}`);
    if (!startEvent) {
      console.warn(`⚠️ Evento de início não encontrado para ${agent}-${task}`);
      return;
    }
    
    const duration = Date.now() - startEvent.timestamp.getTime();
    
    await this.recordEvent({
      type: 'task_end',
      agent,
      task,
      description: `Finalizado: ${startEvent.description} (${this.formatDuration(duration)})`,
      metadata: { 
        ...startEvent.metadata,
        result,
        duration
      },
      status,
      tags: ['task', 'end', agent],
      parentEventId: startEvent.id
    });
    
    this.eventStack.delete(`${agent}-${task}`);
  }

  /**
   * Inicia rastreamento de um agente
   */
  async startAgent(agent: string, metadata: Record<string, any> = {}): Promise<string> {
    const eventId = await this.recordEvent({
      type: 'agent_start',
      agent,
      description: `Agente ${agent} iniciado`,
      metadata,
      status: 'info',
      tags: ['agent', 'start', agent]
    });
    
    this.eventStack.set(`agent-${agent}`, {
      id: eventId,
      timestamp: new Date(),
      type: 'agent_start',
      agent,
      description: `Agente ${agent} iniciado`,
      metadata,
      status: 'info',
      tags: ['agent', 'start']
    });
    
    return eventId;
  }

  /**
   * Finaliza rastreamento de um agente
   */
  async endAgent(agent: string, status: 'success' | 'error', summary?: string): Promise<void> {
    const startEvent = this.eventStack.get(`agent-${agent}`);
    if (!startEvent) {
      console.warn(`⚠️ Evento de início não encontrado para agente ${agent}`);
      return;
    }
    
    const duration = Date.now() - startEvent.timestamp.getTime();
    
    await this.recordEvent({
      type: 'agent_end',
      agent,
      description: `Agente ${agent} finalizado (${this.formatDuration(duration)})${summary ? ': ' + summary : ''}`,
      metadata: { 
        ...startEvent.metadata,
        summary,
        duration
      },
      status,
      tags: ['agent', 'end', agent],
      parentEventId: startEvent.id
    });
    
    this.eventStack.delete(`agent-${agent}`);
  }

  /**
   * Registra um erro
   */
  async recordError(agent: string, error: Error, context?: Record<string, any>): Promise<string> {
    return await this.recordEvent({
      type: 'error',
      agent,
      description: `Erro: ${error.message}`,
      metadata: {
        error: error.name,
        stack: error.stack,
        context
      },
      status: 'error',
      tags: ['error', agent]
    });
  }

  /**
   * Registra um marco importante
   */
  async recordMilestone(description: string, metadata: Record<string, any> = {}): Promise<string> {
    return await this.recordEvent({
      type: 'milestone',
      description,
      metadata,
      status: 'info',
      tags: ['milestone']
    });
  }

  /**
   * Registra uma ação do usuário
   */
  async recordUserAction(description: string, metadata: Record<string, any> = {}): Promise<string> {
    return await this.recordEvent({
      type: 'user_action',
      description,
      metadata,
      status: 'info',
      tags: ['user', 'action']
    });
  }

  /**
   * Obtém eventos da sessão atual
   */
  getCurrentEvents(): TimelineEvent[] {
    return this.currentSession?.events || [];
  }

  /**
   * Analisa a performance da sessão atual
   */
  analyzeCurrentSession(): TimelineAnalysis | null {
    if (!this.currentSession) {
      return null;
    }
    
    return this.analyzeSession(this.currentSession);
  }

  /**
   * Gera relatório da sessão atual
   */
  generateCurrentReport(): string {
    if (!this.currentSession) {
      return 'Nenhuma sessão ativa';
    }
    
    const analysis = this.analyzeSession(this.currentSession);
    const duration = this.currentSession.endTime 
      ? this.currentSession.endTime.getTime() - this.currentSession.startTime.getTime()
      : Date.now() - this.currentSession.startTime.getTime();
    
    return `
# Relatório da Timeline - Sessão ${this.currentSession.id}

## Informações Gerais
- **Início**: ${this.currentSession.startTime.toLocaleString()}
- **Fim**: ${this.currentSession.endTime?.toLocaleString() || 'Em andamento'}
- **Duração**: ${this.formatDuration(duration)}
- **Total de eventos**: ${this.currentSession.events.length}

## Performance dos Agentes
${Object.entries(analysis.agentPerformance).map(([agent, perf]) => 
  `### ${agent}\n- Tempo total: ${this.formatDuration(perf.totalTime)}\n- Tarefas: ${perf.taskCount}\n- Taxa de sucesso: ${perf.successRate.toFixed(1)}%\n- Tempo médio por tarefa: ${this.formatDuration(perf.averageTaskTime)}`
).join('\n\n')}

## Gargalos Identificados
${analysis.bottlenecks.map((bottleneck, i) => 
  `${i + 1}. **${bottleneck.description}** (${this.formatDuration(bottleneck.duration)})\n   Sugestões: ${bottleneck.suggestions.join(', ')}`
).join('\n\n')}

## Timeline de Eventos
${analysis.timeline.map(item => 
  `- ${item.time.toLocaleTimeString()}: ${item.event}${item.duration ? ` (${this.formatDuration(item.duration)})` : ''}`
).join('\n')}

---
*Relatório gerado em ${new Date().toLocaleString()}*
`;
  }

  // Métodos privados
  private analyzeSession(session: TimelineSession): TimelineAnalysis {
    const events = session.events;
    const agentPerformance: Record<string, any> = {};
    const bottlenecks: Array<any> = [];
    const timeline: Array<any> = [];
    
    // Analisar performance dos agentes
    events.forEach(event => {
      if (event.agent && !agentPerformance[event.agent]) {
        agentPerformance[event.agent] = {
          totalTime: 0,
          taskCount: 0,
          successCount: 0,
          tasks: []
        };
      }
      
      if (event.type === 'task_end' && event.agent && event.metadata.duration) {
        const perf = agentPerformance[event.agent];
        perf.totalTime += event.metadata.duration;
        perf.taskCount++;
        if (event.status === 'success') {
          perf.successCount++;
        }
        perf.tasks.push(event.metadata.duration);
        
        // Identificar gargalos (tarefas que demoram mais que 30s)
        if (event.metadata.duration > 30000) {
          bottlenecks.push({
            description: `${event.agent}: ${event.description}`,
            duration: event.metadata.duration,
            suggestions: this.generateBottleneckSuggestions(event.metadata.duration)
          });
        }
      }
      
      // Construir timeline
      timeline.push({
        time: event.timestamp,
        event: `${event.agent || 'System'}: ${event.description}`,
        duration: event.metadata.duration
      });
    });
    
    // Calcular métricas finais
    Object.keys(agentPerformance).forEach(agent => {
      const perf = agentPerformance[agent];
      perf.successRate = perf.taskCount > 0 ? (perf.successCount / perf.taskCount) * 100 : 0;
      perf.averageTaskTime = perf.taskCount > 0 ? perf.totalTime / perf.taskCount : 0;
    });
    
    const totalDuration = session.endTime 
      ? session.endTime.getTime() - session.startTime.getTime()
      : Date.now() - session.startTime.getTime();
    
    return {
      totalDuration,
      agentPerformance,
      bottlenecks: bottlenecks.sort((a, b) => b.duration - a.duration).slice(0, 5),
      timeline: timeline.sort((a, b) => a.time.getTime() - b.time.getTime())
    };
  }

  private async saveSession(): Promise<void> {
    if (!this.currentSession) return;
    
    try {
      await fs.mkdir(path.dirname(this.sessionsFile), { recursive: true });
      
      let sessions: TimelineSession[] = [];
      try {
        const data = await fs.readFile(this.sessionsFile, 'utf-8');
        sessions = JSON.parse(data);
      } catch (error) {
        // Arquivo não existe ainda
      }
      
      // Adicionar ou atualizar sessão
      const existingIndex = sessions.findIndex(s => s.id === this.currentSession!.id);
      if (existingIndex >= 0) {
        sessions[existingIndex] = this.currentSession;
      } else {
        sessions.push(this.currentSession);
      }
      
      // Manter apenas as últimas 50 sessões
      if (sessions.length > 50) {
        sessions = sessions.slice(-50);
      }
      
      await fs.writeFile(this.sessionsFile, JSON.stringify(sessions, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  }

  private getEventEmoji(type: TimelineEvent['type'], status: TimelineEvent['status']): string {
    if (status === 'error') return '❌';
    if (status === 'warning') return '⚠️';
    
    switch (type) {
      case 'agent_start': return '🤖';
      case 'agent_end': return '✅';
      case 'task_start': return '🔄';
      case 'task_end': return '✅';
      case 'milestone': return '🎯';
      case 'user_action': return '👤';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  }

  private generateBottleneckSuggestions(duration: number): string[] {
    const suggestions = [];
    
    if (duration > 60000) {
      suggestions.push('Considerar paralelização');
    }
    
    if (duration > 30000) {
      suggestions.push('Otimizar algoritmo');
      suggestions.push('Implementar cache');
    }
    
    suggestions.push('Monitorar recursos');
    
    return suggestions;
  }
}