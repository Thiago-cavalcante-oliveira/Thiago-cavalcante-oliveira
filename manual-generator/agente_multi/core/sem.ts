// agente_multi/core/sem.ts
export class Semaphore {
  private q: (()=>void)[] = []; private c=0;
  constructor(private max: number) {}
  async acquire(){ if(this.c<this.max){this.c++; return;} await new Promise<void>(r=>this.q.push(r)); this.c++; }
  release(){ this.c--; const n=this.q.shift(); n?.(); }
}